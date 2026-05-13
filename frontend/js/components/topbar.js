// ─────────────────────────────────────────────────────────────
// Topbar helpers
// ─────────────────────────────────────────────────────────────

function setPageTitle(title) {
  document.getElementById('page-title').textContent = title;
}

function setTopbarActions(html) {
  document.getElementById('topbar-actions').innerHTML = html;
}

function clearTopbarActions() {
  document.getElementById('topbar-actions').innerHTML = '';
}
