// ─────────────────────────────────────────────────────────────
// Auth API — login, signup, logout, refresh, update password
// ─────────────────────────────────────────────────────────────

async function refreshAccessToken() {
  try {
    const res = await fetch(API + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: state.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    state.accessToken  = data.accessToken;
    state.refreshToken = data.refreshToken;
    saveSession();
    return true;
  } catch { return false; }
}

async function apiLogin(email, password) {
  return api('POST', '/auth/login', { email, password });
}

async function apiSignup(name, email, password, role) {
  return api('POST', '/auth/signup', { name, email, password, role });
}

async function apiLogout(refreshToken) {
  return api('POST', '/auth/logout', { refreshToken });
}

async function apiUpdatePassword(currentPassword, newPassword) {
  return api('POST', '/auth/update-password', { currentPassword, newPassword });
}
