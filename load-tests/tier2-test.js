import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load pre-authenticated users from 5,000 pool
const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});

// Target server URL (defaults to Fly.io)
const BASE_URL = __ENV.BASE_URL || 'https://to-do-list-backend-psvxmg.fly.dev';

// Dynamic Virtual User (VU) Configuration
// Pass via CLI: `k6 run -e VUS=400 load-tests/tier2-test.js`
const PEAK_VUS = parseInt(__ENV.VUS || '400', 10);
const WARMUP_VUS = Math.max(1, Math.round(PEAK_VUS * 0.4));
const SURGE_VUS = Math.max(1, Math.round(PEAK_VUS * 0.75));

export const options = {
  stages: [
    { duration: '30s', target: WARMUP_VUS }, // Warm-up
    { duration: '30s', target: SURGE_VUS },  // Surge
    { duration: '20s', target: PEAK_VUS },   // Peak
    { duration: '1m00s', target: PEAK_VUS }, // Sustain
    { duration: '20s', target: 0 },          // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],    // Expect < 5% errors
    http_req_duration: ['p(95)<3000'], // 95% under 3 seconds
  },
};

export default function () {
  if (__ITER === 0) {
    sleep(Math.random() * 2);
  }

  // Each VU gets its own isolated user account from pool
  const user = users[(__VU - 1) % users.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  // 1. Fetch Notes Dashboard
  const listRes = http.get(`${BASE_URL}/api/notes/all`, {
    headers,
    tags: { name: 'GET /api/notes/all' },
  });

  const listOk = check(listRes, {
    'GET /api/notes/all status 200': (r) => r.status === 200,
  });

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
      body: 'Generated from tier-2 dynamic test',
      tag: 'work',
    });

    const createRes = http.post(`${BASE_URL}/api/notes`, payload, {
      headers,
      tags: { name: 'POST /api/notes' },
    });

    check(createRes, {
      'POST /api/notes status 201': (r) => r.status === 201,
    });
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

    check(updateRes, {
      'PATCH /api/notes/:id status 200': (r) => r.status === 200,
    });
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

    check(deleteRes, {
      'DELETE /api/notes/:id status 200': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 1.5 + 0.5);
}
