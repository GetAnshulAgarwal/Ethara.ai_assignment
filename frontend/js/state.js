// ─────────────────────────────────────────────────────────────
// Central application state
// ─────────────────────────────────────────────────────────────
const state = {
  user:             null,
  accessToken:      null,
  refreshToken:     null,
  authMode:         'login',
  currentPage:      'dashboard',
  currentProjectId: null,
  projects:         [],
  passwordWarning:  null,  // set after login if legacy password detected
};

// ─────────────────────────────────────────────────────────────
// Session persistence (sessionStorage)
// ─────────────────────────────────────────────────────────────
function saveSession() {
  sessionStorage.setItem('ttm_access',  state.accessToken);
  sessionStorage.setItem('ttm_refresh', state.refreshToken);
  sessionStorage.setItem('ttm_user',    JSON.stringify(state.user));
  if (state.passwordWarning) {
    sessionStorage.setItem('ttm_pw_warn', JSON.stringify(state.passwordWarning));
  }
}

function loadSession() {
  state.accessToken     = sessionStorage.getItem('ttm_access');
  state.refreshToken    = sessionStorage.getItem('ttm_refresh');
  const u               = sessionStorage.getItem('ttm_user');
  state.user            = u ? JSON.parse(u) : null;
  const w               = sessionStorage.getItem('ttm_pw_warn');
  state.passwordWarning = w ? JSON.parse(w) : null;
}

function clearSession() {
  sessionStorage.removeItem('ttm_access');
  sessionStorage.removeItem('ttm_refresh');
  sessionStorage.removeItem('ttm_user');
  sessionStorage.removeItem('ttm_pw_warn');
}
