// ─────────────────────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────────────────────

function toast(msg) {
  const el = document.createElement('div');
  el.className   = 'toast-item';
  el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
