// ─────────────────────────────────────────────────────────────
// app.js — Entry point
// Bootstraps the application on page load
// ─────────────────────────────────────────────────────────────

// Enter key on auth form submits it
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('auth-screen').classList.contains('hidden')) {
    submitAuth();
  }
});

// Boot
(function init() {
  loadSession();
  if (state.user && state.accessToken) {
    showApp();
  } else {
    showAuth();
  }
})();
