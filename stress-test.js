import http from 'k6/http';
import { sleep, check } from 'k6';

const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:5173';

export const options = {
  stages: [
    { duration: '15s', target: 10 },  // разгон до 10 VUs
    { duration: '20s', target: 25 },  // рост до 25 VUs
    { duration: '20s', target: 50 },  // рост до 50 VUs
    { duration: '20s', target: 100 }, // выше нормы: 100 VUs
    { duration: '20s', target: 150 }, // стресс-нагрузка: 150 VUs
    { duration: '15s', target: 0 },   // плавное снижение до 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],     // допустимый порог ошибок для стресса (<5%)
    http_req_duration: ['p(95)<1500'],  // ориентир по p95
  },
};

export default function () {
  const res = http.get(TARGET_URL, {
    tags: { name: 'GET / (stress)' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}