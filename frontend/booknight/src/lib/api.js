const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('booknight_token');

/**
 * Core request helper. Throws an Error with the backend's message on
 * non-2xx responses so callers can just try/catch.
 */
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `Request failed with status ${res.status}`);
    // Surface any extra fields the backend attached (e.g. login's
    // requiresVerification/email, used to redirect to the verify-email page).
    Object.assign(err, data);
    throw err;
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: payload, auth: false }),
  resetPassword: (token, payload) =>
    request(`/auth/reset-password/${token}`, { method: 'POST', body: payload, auth: false }),
  verifyEmail: (payload) => request('/auth/verify-email', { method: 'POST', body: payload, auth: false }),
  resendVerification: (payload) =>
    request('/auth/resend-verification', { method: 'POST', body: payload, auth: false }),

  listWorkspaces: () => request('/workspaces'),
  createWorkspace: (payload) => request('/workspaces', { method: 'POST', body: payload }),
  getWorkspace: (id) => request(`/workspaces/${id}`),
  updateWorkspace: (id, payload) => request(`/workspaces/${id}`, { method: 'PATCH', body: payload }),
  deleteWorkspace: (id) => request(`/workspaces/${id}`, { method: 'DELETE' }),
  addWorkspaceMember: (id, email) =>
    request(`/workspaces/${id}/members`, { method: 'POST', body: { email } }),
  removeWorkspaceMember: (id, memberId) =>
    request(`/workspaces/${id}/members/${memberId}`, { method: 'DELETE' }),

  listBookmarks: (workspaceId) => request(`/bookmarks?workspaceId=${workspaceId}&limit=60`),
  searchBookmarks: (workspaceId, q) =>
    request(`/bookmarks/search?workspaceId=${workspaceId}&q=${encodeURIComponent(q)}`),
  createBookmark: (payload) => request('/bookmarks', { method: 'POST', body: payload }),
  getBookmark: (id) => request(`/bookmarks/${id}`),
  updateBookmark: (id, payload) => request(`/bookmarks/${id}`, { method: 'PATCH', body: payload }),
  deleteBookmark: (id) => request(`/bookmarks/${id}`, { method: 'DELETE' }),
};

export { getToken, BASE_URL };