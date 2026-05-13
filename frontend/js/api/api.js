const API = '/api';

// ─────────────────────────────────────────────────────────────
// Core fetch wrapper
// Attaches auth header, handles 401 → token refresh → retry
// ─────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.accessToken) opts.headers['Authorization'] = `Bearer ${state.accessToken}`;
  if (body) opts.body = JSON.stringify(body);

  let res = await fetch(API + path, opts);

  // Access token expired — attempt silent refresh and retry once
  if (res.status === 401 && state.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      opts.headers['Authorization'] = `Bearer ${state.accessToken}`;
      res = await fetch(API + path, opts);
    } else {
      showAuth();
      return null;
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
