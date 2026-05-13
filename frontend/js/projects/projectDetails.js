// ─────────────────────────────────────────────────────────────
// Project detail page
// ─────────────────────────────────────────────────────────────

async function renderProject(projectId) {
  document.getElementById('page-title').textContent   = 'Loading…';
  document.getElementById('topbar-actions').innerHTML = '';
  const content = document.getElementById('content');
  content.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';

  try {
    const [projData, taskData] = await Promise.all([
      apiGetProject(projectId),
      apiGetTasks(projectId),
    ]);

    const { project, members } = projData;
    const isAdmin = project.my_role === 'admin';

    document.getElementById('page-title').textContent   = project.name;
    document.getElementById('topbar-actions').innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openCreateTaskModal(${projectId}, ${JSON.stringify(members).replace(/"/g,'&quot;')})">+ New Task</button>
      <button class="btn btn-ghost btn-sm"   onclick="openManageMembersModal(${projectId}, ${JSON.stringify(members).replace(/"/g,'&quot;')})">Members (${members.length})</button>
    `;

    const s = taskData.summary;
    content.innerHTML = `
      <div class="stats-row">
        ${statCard(s.todo,        'To Do')}
        ${statCard(s.in_progress, 'In Progress', 'var(--primary)')}
        ${statCard(s.done,        'Done',         'var(--success)')}
        ${statCard(s.overdue,     'Overdue',      'var(--danger)')}
      </div>
      <div class="card">
        <div class="card-header">
          <h2>Tasks</h2>
          <div class="filter-row" style="margin-bottom:0">
            <select id="filter-status"   onchange="filterTasks(${projectId})" style="width:120px">
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select id="filter-priority" onchange="filterTasks(${projectId})" style="width:120px">
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div id="tasks-table">${renderTasksTable(taskData.tasks, isAdmin, projectId, members)}</div>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="error-msg">${err.error || 'Failed to load project'}</div>`;
  }
}
