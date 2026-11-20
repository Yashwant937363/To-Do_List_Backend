import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate, Counter } from 'k6/metrics';

// Load pre-generated authenticated user tokens from users.json
const users = new SharedArray('users', () => JSON.parse(open('./users.json')));
const BASE_URL = __ENV.BASE_URL || 'https://to-do-list-backend-psvxmg.fly.dev';

// Dynamic Virtual User (VU) Configuration
// Pass via CLI: `k6 run -e VUS=450 load-tests/colab-test.js`
const PEAK_VUS = parseInt(__ENV.VUS || '400', 10);
const WARMUP_VUS = Math.max(1, Math.round(PEAK_VUS * 0.4));  // 40% of peak
const SURGE_VUS = Math.max(1, Math.round(PEAK_VUS * 0.75));  // 75% of peak

// Custom Metrics Tracking
const errorRate = new Rate('custom_error_rate');
const failed4xx = new Counter('errors_4xx');
const failed5xx = new Counter('errors_5xx');

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '30s', target: WARMUP_VUS }, // Gentle warm-up
    { duration: '30s', target: SURGE_VUS },  // Steady surge
    { duration: '20s', target: PEAK_VUS },   // Peak concurrency
    { duration: '1m00s', target: PEAK_VUS }, // Sustain at peak
    { duration: '20s', target: 0 },          // Graceful ramp-down
  ],
  thresholds: {
    custom_error_rate: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

// Helper: Inspect and log failures to errors.log
function verifyRequest(res, expectedStatus, actionName) {
  const isOk = res.status === expectedStatus;
  errorRate.add(!isOk);

  if (!isOk) {
    if (res.status >= 500 || res.status === 0) {
      failed5xx.add(1);
    } else if (res.status >= 400) {
      failed4xx.add(1);
    }
    console.error(
      `❌ [${new Date().toISOString()}] ${actionName} | HTTP ${res.status} | Err: ${res.error || 'None'} | URL: ${res.url}`
    );
  }
  return isOk;
}

export default function () {
  if (__ITER === 0) {
    sleep(Math.random() * 2);
  }

  // Assign distinct user per VU from pool
  const user = users[(__VU - 1) % users.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  // 1. Fetch Notes Dashboard (100% of VUs)
  const listRes = http.get(`${BASE_URL}/api/notes/all`, {
    headers,
    tags: { name: 'GET /api/notes/all' },
  });

  const listOk = verifyRequest(listRes, 200, 'GET /api/notes/all');
  if (!listOk) {
    sleep(1);
    return;
  }

  const notes = listRes.json('data') || [];
  sleep(Math.random() * 1.5 + 0.5);

  const roll = Math.random() * 100;

  if (roll < 25) {
    // 25%: Create Note
    const payload = JSON.stringify({
      title: `Task by ${user.username} @ ${Date.now()}`,
      body: 'Generated from dynamic cloud load test',
      tag: 'work',
    });

    const createRes = http.post(`${BASE_URL}/api/notes`, payload, {
      headers,
      tags: { name: 'POST /api/notes' },
    });

    verifyRequest(createRes, 201, 'POST /api/notes');
  } else if (roll < 45 && notes.length > 0) {
    // 20%: Update Note
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    const payload = JSON.stringify({
      title: `${randomNote.title} (Updated)`,
      body: randomNote.body,
      tag: randomNote.tag,
    });

    const updateRes = http.patch(
      `${BASE_URL}/api/notes/${randomNote.id}`,
      payload,
      {
        headers,
        tags: { name: 'PATCH /api/notes/:id' },
      }
    );

    verifyRequest(updateRes, 200, 'PATCH /api/notes/:id');
  } else if (roll < 55 && notes.length > 0) {
    // 10%: Delete Note
    const randomNote = notes[Math.floor(Math.random() * notes.length)];

    const deleteRes = http.del(
      `${BASE_URL}/api/notes/${randomNote.id}`,
      null,
      {
        headers,
        tags: { name: 'DELETE /api/notes/:id' },
      }
    );

    verifyRequest(deleteRes, 200, 'DELETE /api/notes/:id');
  }

  sleep(Math.random() * 1.5 + 0.5);
}

// Clean Formatted Summary Table with p90, p95, p99
export function handleSummary(data) {
  const p90 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(90)'].toFixed(2) : 'N/A';
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 'N/A';
  const p99 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'].toFixed(2) : 'N/A';
  const avg = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 'N/A';
  const min = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.min.toFixed(2) : 'N/A';
  const max = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max.toFixed(2) : 'N/A';
  const med = data.metrics.http_req_duration ? data.metrics.http_req_duration.values.med.toFixed(2) : 'N/A';
  const errRate = data.metrics.custom_error_rate ? (data.metrics.custom_error_rate.values.rate * 100).toFixed(2) : '0';
  const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const count4xx = data.metrics.errors_4xx ? data.metrics.errors_4xx.values.count : 0;
  const count5xx = data.metrics.errors_5xx ? data.metrics.errors_5xx.values.count : 0;

  const summary = `
===============================================================
📊 ${PEAK_VUS} VU CLOUD LOAD TEST SUMMARY (GOOGLE COLAB -> FLY.IO)
===============================================================
• Target Concurrency:       ${PEAK_VUS} Virtual Users (Dynamic)
• Total Requests Dispatched: ${totalReqs}
• Overall Error Rate:        ${errRate}%
  - Client 4xx Errors:       ${count4xx}
  - Server 5xx/Net Errors:   ${count5xx}
---------------------------------------------------------------
⏱️ COMPLETE LATENCY PERCENTILES:
  - Minimum (Fastest):      ${min} ms
  - Median (p50):           ${med} ms
  - Average:                ${avg} ms
  - p90 (90th Percentile):  ${p90} ms
  - p95 (95th Percentile):  ${p95} ms
  - p99 (99th Percentile):  ${p99} ms
  - Maximum (Slowest):      ${max} ms
===============================================================
`;
  return { stdout: summary };
}
