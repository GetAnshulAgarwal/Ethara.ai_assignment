// ─────────────────────────────────────────────────────────────
// App shell transitions and logout
// ─────────────────────────────────────────────────────────────

function showAuth() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('sidebar-user-name').textContent  = state.user.name;
  document.getElementById('sidebar-user-email').textContent = state.user.email;
  document.getElementById('sidebar-user-role').innerHTML    = roleBadge(state.user.role || 'member');
  navigate('dashboard');
  loadSidebarProjects();
}

async function logout() {
  try { await apiLogout(state.refreshToken); } catch {}
  clearSession();
  state.user = state.accessToken = state.refreshToken = state.passwordWarning = null;
  showAuth();
}
