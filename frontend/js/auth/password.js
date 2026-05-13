// ─────────────────────────────────────────────────────────────
// Password warning banner (legacy accounts) + update modal
// ─────────────────────────────────────────────────────────────

// Live hint updater — used on both the signup form and the update-password modal
function checkPasswordHints(password, prefix) {
  const letters  = (password.match(/[a-zA-Z]/g)    || []).length;
  const numbers  = (password.match(/[0-9]/g)        || []).length;
  const specials = (password.match(/[^a-zA-Z0-9]/g) || []).length;

  function setHint(id, ok) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('ok', ok);
  }
  setHint(`${prefix}-letters`, letters  >= 6);
  setHint(`${prefix}-numbers`, numbers  >= 3);
  setHint(`${prefix}-special`, specials >= 2);
  setHint(`${prefix}-length`,  password.length >= 11);
}

// Called from the signup password field oninput
function onSignupPasswordInput() {
  if (state.authMode !== 'signup') return;
  checkPasswordHints(document.getElementById('auth-password').value, 'hint');
}

// Called from the update-password modal password field oninput
function updatePwHints() {
  checkPasswordHints(document.getElementById('m-new-pw').value, 'mhint');
}

// ── Warning banner ────────────────────────────────────────────

function renderPasswordWarningBanner() {
  if (!state.passwordWarning) return '';
  return `
    <div id="pw-warning-banner">
      <div class="pw-icon">⚠️</div>
      <div class="pw-body">
        <div class="pw-title">Your password needs to be updated</div>
        <div class="pw-text">
          We've upgraded our security requirements. Your current password doesn't meet the new policy.
          Please update it to keep your account secure.
          <br/><br/>
          <strong>New requirements:</strong> at least 6 letters, 3 numbers, and 2 special characters (e.g. <code>!@#$%</code>).
        </div>
        <div class="pw-actions">
          <button class="btn btn-warning btn-sm" onclick="openUpdatePasswordModal()">Update Password Now</button>
          <button class="btn btn-ghost btn-sm"   onclick="dismissPasswordWarning()">Remind Me Later</button>
        </div>
      </div>
      <button class="pw-dismiss" onclick="dismissPasswordWarning()" title="Dismiss">✕</button>
    </div>`;
}

function dismissPasswordWarning() {
  // Clears for this session; warning reappears on next login until password is changed
  state.passwordWarning = null;
  sessionStorage.removeItem('ttm_pw_warn');
  const banner = document.getElementById('pw-warning-banner');
  if (banner) banner.remove();
}

// ── Update password modal ─────────────────────────────────────

function openUpdatePasswordModal() {
  openModal(`
    <h2>🔒 Update Password</h2>
    <div id="modal-err" class="error-msg hidden"></div>
    <div id="modal-ok"  class="success-msg hidden"></div>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:18px;line-height:1.6">
      Your new password must contain at least <strong>6 letters</strong>,
      <strong>3 numbers</strong>, and <strong>2 special characters</strong>
      (minimum 11 characters total).
    </p>
    <div class="form-group">
      <label>Current Password</label>
      <input id="m-cur-pw" type="password" placeholder="Enter your current password"/>
    </div>
    <div class="form-group">
      <label>New Password</label>
      <input id="m-new-pw" type="password" placeholder="Create a strong password" oninput="updatePwHints()"/>
      <ul class="pw-hint-list" id="modal-pw-hints" style="margin-top:8px">
        <li id="mhint-letters">6+ letters</li>
        <li id="mhint-numbers">3+ numbers</li>
        <li id="mhint-special">2+ special characters</li>
        <li id="mhint-length">11+ characters total</li>
      </ul>
    </div>
    <div class="form-group">
      <label>Confirm New Password</label>
      <input id="m-confirm-pw" type="password" placeholder="Repeat new password"/>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="m-save-pw-btn" onclick="submitUpdatePassword()">Update Password</button>
    </div>
  `);
}

async function submitUpdatePassword() {
  const currentPassword = document.getElementById('m-cur-pw').value;
  const newPassword     = document.getElementById('m-new-pw').value;
  const confirmPassword = document.getElementById('m-confirm-pw').value;
  const errEl           = document.getElementById('modal-err');
  const okEl            = document.getElementById('modal-ok');
  const btn             = document.getElementById('m-save-pw-btn');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (!currentPassword || !newPassword || !confirmPassword) {
    errEl.textContent = 'All fields are required.';
    errEl.classList.remove('hidden');
    return;
  }
  if (newPassword !== confirmPassword) {
    errEl.textContent = 'New passwords do not match.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  try {
    await apiUpdatePassword(currentPassword, newPassword);

    // Clear warning — password is now compliant
    state.passwordWarning = null;
    sessionStorage.removeItem('ttm_pw_warn');
    const banner = document.getElementById('pw-warning-banner');
    if (banner) banner.remove();

    okEl.textContent = 'Password updated successfully! You may need to log in again on other devices.';
    okEl.classList.remove('hidden');
    btn.textContent = 'Done';
    btn.disabled    = false;

    setTimeout(() => closeModal(), 2200);
    toast('Password updated successfully!');
  } catch (err) {
    errEl.textContent = err.error || (err.errors && err.errors[0]?.msg) || 'Failed to update password.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
  }
}
