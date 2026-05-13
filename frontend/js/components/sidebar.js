// ─────────────────────────────────────────────────────────────
// Sidebar — user info + dynamic project links
// ─────────────────────────────────────────────────────────────

async function loadSidebarProjects() {
  try {
    const data = await apiGetProjects();
    state.projects = data.projects || [];
    const el = document.getElementById('sidebar-projects');
    el.innerHTML = state.projects.slice(0, 8).map(p => `
      <div class="nav-item" id="nav-proj-${p.id}" onclick="navigate('project', ${p.id})">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</span>
        ${p.my_role === 'admin' ? '<span class="badge badge-admin" style="margin-left:auto;font-size:10px">A</span>' : ''}
      </div>
    `).join('');
  } catch {}
}
