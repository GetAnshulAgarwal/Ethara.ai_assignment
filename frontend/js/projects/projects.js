// ─────────────────────────────────────────────────────────────
// Projects list page
// ─────────────────────────────────────────────────────────────

async function renderProjects() {
  document.getElementById('page-title').textContent  = 'Projects';
  document.getElementById('topbar-actions').innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="openCreateProjectModal()">+ New Project</button>`;
  const content = document.getElementById('content');
  content.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';

  try {
    const data = await apiGetProjects();
    state.projects = data.projects || [];
    loadSidebarProjects();

    if (state.projects.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p>No projects yet.</p><br>
          <button class="btn btn-primary" onclick="openCreateProjectModal()">Create your first project</button>
        </div>`;
      return;
    }

    content.innerHTML = `
      <div class="card">
        <table>
          <thead>
            <tr><th>Project</th><th>Role</th><th>Members</th><th>Tasks</th><th>Overdue</th><th></th></tr>
          </thead>
          <tbody>
            ${state.projects.map(p => `
              <tr>
                <td>
                  <a class="link" onclick="navigate('project', ${p.id})">${esc(p.name)}</a>
                  ${p.description ? `<div style="color:var(--text-muted);font-size:12px">${esc(p.description.substring(0, 60))}${p.description.length > 60 ? '…' : ''}</div>` : ''}
                </td>
                <td>${roleBadge(p.my_role)}</td>
                <td>${p.member_count}</td>
                <td>${p.task_count}</td>
                <td>${p.overdue_count > 0 ? `<span style="color:var(--danger);font-weight:600">${p.overdue_count}</span>` : '0'}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="navigate('project', ${p.id})">Open →</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="error-msg">${err.error || 'Failed to load projects'}</div>`;
  }
}
