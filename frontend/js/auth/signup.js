// ─────────────────────────────────────────────────────────────
// Signup form handler and auth mode toggle
// ─────────────────────────────────────────────────────────────

function toggleAuthMode() {
  state.authMode = state.authMode === 'login' ? 'signup' : 'login';
  const isSignup = state.authMode === 'signup';

  document.getElementById('signup-fields').classList.toggle('hidden', !isSignup);
  document.getElementById('pw-hints').classList.toggle('hidden', !isSignup);
  document.getElementById('auth-subtitle').textContent    = isSignup ? 'Create your account'      : 'Sign in to your account';
  document.getElementById('auth-submit-btn').textContent  = isSignup ? 'Sign Up'                   : 'Sign In';
  document.getElementById('auth-toggle-text').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
  document.getElementById('auth-toggle-link').textContent = isSignup ? ' Sign in'                 : ' Sign up';
  document.getElementById('auth-error').classList.add('hidden');

  if (isSignup) setTimeout(setupRoleToggle, 0);
}

async function submitSignup(name, email, password, role) {
  const data = await apiSignup(name, email, password, role);
  state.accessToken     = data.accessToken;
  state.refreshToken    = data.refreshToken;
  state.user            = data.user;
  state.passwordWarning = null; // new accounts always meet policy
  saveSession();
  showApp();
}

// Unified submit handler — dispatches to login or signup
async function submitAuth() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl    = document.getElementById('auth-error');
  errEl.classList.add('hidden');

  if (!email || !password) {
    errEl.textContent = 'Email and password are required.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('auth-submit-btn');
  btn.disabled = true;

  try {
    if (state.authMode === 'login') {
      await submitLogin(email, password);
    } else {
      const name = document.getElementById('auth-name').value.trim();
      if (!name) {
        errEl.textContent = 'Name is required.';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        return;
      }
      const roleEl = document.querySelector('input[name="auth-role"]:checked');
      const role   = roleEl ? roleEl.value : 'member';
      await submitSignup(name, email, password, role);
    }
  } catch (err) {
    errEl.textContent = err.error || (err.errors && err.errors[0]?.msg) || 'Authentication failed.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
}

// Highlight the selected role card
function setupRoleToggle() {
  document.querySelectorAll('input[name="auth-role"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const adminChecked  = document.getElementById('role-admin').checked;
      const memberChecked = document.getElementById('role-member').checked;

      document.getElementById('role-admin-label').style.borderColor  = adminChecked  ? 'var(--primary)' : 'var(--border)';
      document.getElementById('role-admin-label').style.background   = adminChecked  ? '#eff6ff'        : '';
      document.getElementById('role-member-label').style.borderColor = memberChecked ? 'var(--primary)' : 'var(--border)';
      document.getElementById('role-member-label').style.background  = memberChecked ? '#eff6ff'        : '';
    });
  });
}
