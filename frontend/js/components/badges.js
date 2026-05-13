// ─────────────────────────────────────────────────────────────
// Badge renderers
// ─────────────────────────────────────────────────────────────

function statusBadge(s) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
}

function priorityBadge(p) {
  return `<span class="badge badge-${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</span>`;
}

function roleBadge(r) {
  return `<span class="badge badge-${r}">${r.charAt(0).toUpperCase() + r.slice(1)}</span>`;
}
