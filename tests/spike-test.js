import http from 'k6/http';
import { sleep, check } from 'k6';

const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:5173';

export const options = {
  stages: [
    { duration: '15s', target: 10 },  // базовая спокойная нагрузка (10 VUs)
    { duration: '5s',  target: 120 }, // резкий скачок (spike) до 120 VUs
    { duration: '25s', target: 120 }, // удержание пика
    { duration: '5s',  target: 10 },  // резкий спад обратно до 10 VUs
    { duration: '20s', target: 10 },  // проверка восстановления системы
    { duration: '10s', target: 0 },   // завершение
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const res = http.get(TARGET_URL, {
    tags: { name: 'GET / (spike)' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
