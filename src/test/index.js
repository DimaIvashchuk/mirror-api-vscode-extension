import axios from 'axios';
import fetch from 'node-fetch';

// ✅ Proxy server
const PROXY_HOST = 'localhost';
const PROXY_PORT = 8888;
// ✅ We'll test multiple HTTP status codes
const STATUS_CODES = [
  200, 201, 204, 400, 401, 403, 404, 409, 429, 500, 502, 503,
];

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

// --- Using Axios ---
async function testAxios() {
  console.log('\n=== 🧩 Testing via Axios ===');

  const api = axios.create({
    baseURL: 'http://0.0.0.0:80',
    proxy: {
      host: PROXY_HOST,
      port: PROXY_PORT,
      protocol: 'http',
    },
    validateStatus: () => true, // Prevent Axios from throwing on non-2xx
  });

  for (const method of METHODS) {
    try {
      const res = await api.request({
        url: method.toLowerCase(),
        method,
      });
      console.log(`[AXIOS] ${method}`, res.status, res.statusText);
    } catch (err) {
      console.error(`[AXIOS] ${method}: ERROR`, err.message);
    }
  }

  for (const code of STATUS_CODES) {
    try {
      const res = await api.get(`/status/${code}`);
      console.log(`[AXIOS] ${code}:`, res.status, res.statusText);
    } catch (err) {
      console.error(`[AXIOS] ${code}: ERROR`, err.message);
    }
  }
}

// --- Using Fetch ---
async function testFetch() {
  console.log('\n=== 🌐 Testing via Fetch ===');

  for (const method of METHODS) {
    try {
      const res = await fetch(`http://${PROXY_HOST}:${PROXY_PORT}/http://0.0.0.0:80/${method.toLowerCase()}`, {
        method: method,
      });
      console.log(`[FETCH] ${method}:`, res.status, res.statusText);
    } catch (err) {
      console.error(`[FETCH] ${method} 200: ERROR`, err.message);
    }
  }

  for (const code of STATUS_CODES) {
    // Route everything through your proxy
    const proxiedUrl = `http://${PROXY_HOST}:${PROXY_PORT}/http://0.0.0.0:80/status/${code}`;
    try {
      const res = await fetch(proxiedUrl);
      console.log(`[FETCH] ${code}:`, res.status, res.statusText);
    } catch (err) {
      console.error(`[FETCH] ${code}: ERROR`, err.message);
    }
  }
}

// --- Run both tests ---
(async () => {
  await testAxios();
  // await testFetch();
})();
