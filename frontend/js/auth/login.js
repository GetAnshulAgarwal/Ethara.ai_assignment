// ─────────────────────────────────────────────────────────────
// Login form handler
// ─────────────────────────────────────────────────────────────

async function submitLogin(email, password) {
  const data = await apiLogin(email, password);
  state.accessToken     = data.accessToken;
  state.refreshToken    = data.refreshToken;
  state.user            = data.user;
  state.passwordWarning = data.passwordWarning || null;
  saveSession();
  showApp();
}
