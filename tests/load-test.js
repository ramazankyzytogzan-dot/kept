import http from 'k6/http';
import { sleep, check } from 'k6';

const VUS = Number(__ENV.VUS || 5);
const DURATION = __ENV.DURATION || '10s';
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:5173';

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.01'],     // ошибок меньше 1%
    http_req_duration: ['p(95)<800'],   // 95% запросов быстрее 800 мс
  },
};

export default function () {
  const res = http.get(TARGET_URL, {
    tags: { name: 'GET /' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
