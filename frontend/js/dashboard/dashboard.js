// ─────────────────────────────────────────────────────────────
// Dashboard page renderer
// ─────────────────────────────────────────────────────────────

async function renderDashboard() {
  document.getElementById('page-title').textContent   = 'Dashboard';
  document.getElementById('topbar-actions').innerHTML = '';
  const content = document.getElementById('content');
  content.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';

  try {
    const data = await apiGetDashboard();
    const s    = data.summary;

    content.innerHTML = `
      ${renderPasswordWarningBanner()}
      <div class="stats-row">
        ${statCard(s.total,       'Total Tasks')}
        ${statCard(s.todo,        'To Do')}
        ${statCard(s.in_progress, 'In Progress', 'var(--primary)')}
        ${statCard(s.done,        'Done',         'var(--success)')}
        ${statCard(s.overdue,     'Overdue',      'var(--danger)')}
      </div>
      <div class="card">
        <div class="card-header"><h2>My Tasks</h2></div>
        ${data.tasks.length === 0
          ? '<div class="empty-state">No tasks assigned to you yet.</div>'
          : renderDashboardTasksTable(data.tasks)}
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="error-msg">${err.error || 'Failed to load dashboard'}</div>`;
  }
}

function renderDashboardTasksTable(tasks) {
  return `
    <table>
      <thead>
        <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th></tr>
      </thead>
      <tbody>
        ${tasks.map(t => {
          const overdue = t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
          return `<tr class="${overdue ? 'overdue-row' : ''}">
            <td>${esc(t.title)}</td>
            <td><a class="link" onclick="navigate('project', ${t.project_id})">${esc(t.project_name)}</a></td>
            <td>${statusBadge(t.status)}</td>
            <td>${priorityBadge(t.priority)}</td>
            <td>${t.due_date ? formatDate(t.due_date) + (overdue ? ' ⚠️' : '') : '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}
