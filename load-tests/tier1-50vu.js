import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load pre-authenticated users
const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  // 50 VUs over 2 minutes
  stages: [
    { duration: '15s', target: 25 },  // Ramp up to 25 VUs
    { duration: '15s', target: 50 },  // Ramp up to 50 VUs
    { duration: '1m15s', target: 50 },// Sustain heavy load at 50 VUs for 75 seconds
    { duration: '15s', target: 0 },   // Cool down ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],    // Warn if error rate exceeds 10%
    http_req_duration: ['p(95)<3000'], // Monitor p95 latency
  },
};

export default function () {
  if (__ITER === 0) {
    sleep(Math.random() * 3);
  }

  // Pick user mapped to VU
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
    sleep(2);
    return;
  }

  const notes = listRes.json('data') || [];

  // Think Time
  sleep(Math.random() * 2 + 1);

  // Probabilistic Actions
  const roll = Math.random() * 100;

  if (roll < 25) {
    // 25%: Create
    const payload = JSON.stringify({
      title: `Task by ${user.username} @ ${Date.now()}`,
      body: 'Generated automatically during 50 VU stress test',
      tag: 'work',
    });

    const createRes = http.post(`${BASE_URL}/api/notes`, payload, {
      headers,
      tags: { name: 'POST /api/notes' },
    });

    check(createRes, {
      'POST /api/notes status 201': (r) => r.status === 201,
    });
  } else if (roll < 43 && notes.length > 0) {
    // 18%: Update
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
  } else if (roll < 50 && notes.length > 0) {
    // 7%: Delete
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

  // Idle cooldown
  sleep(Math.random() * 2 + 1);
}
