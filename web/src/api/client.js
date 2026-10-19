export function getApiBase() {
  const custom = localStorage.getItem('nagmani_api_url');
  if (custom) return custom.replace(/\/$/, '');
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

export function setApiBase(url) {
  if (url && url.trim()) {
    localStorage.setItem('nagmani_api_url', url.trim().replace(/\/$/, ''));
  } else {
    localStorage.removeItem('nagmani_api_url');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const base = getApiBase();
  const url = `${base}/api/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.hash.includes('/login')) {
      window.location.hash = '#/login';
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};
