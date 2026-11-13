const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(method, url, body) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !url.startsWith('/auth/login')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  get: (u) => req('GET', u),
  post: (u, b) => req('POST', u, b ?? {}),
  put: (u, b) => req('PUT', u, b),
  patch: (u, b) => req('PATCH', u, b),
  del: (u) => req('DELETE', u),
};
