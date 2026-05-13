// ─────────────────────────────────────────────────────────────
// Tasks table renderer (used by project detail + filters)
// ─────────────────────────────────────────────────────────────

function renderTasksTable(tasks, isAdmin, projectId, members) {
  if (tasks.length === 0) {
    return '<div class="empty-state">No tasks yet. Create one!</div>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Assigned To</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Due Date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(t => {
          const overdue = t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
          const canEdit = isAdmin || t.assigned_to === state.user.id || t.created_by === state.user.id;
          return `<tr class="${overdue ? 'overdue-row' : ''}">
            <td>
              ${esc(t.title)}
              ${t.description ? `<div style="color:var(--text-muted);font-size:12px">${esc(t.description.substring(0,60))}…</div>` : ''}
            </td>
            <td>${t.assigned_to_name ? esc(t.assigned_to_name) : '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${priorityBadge(t.priority)}</td>
            <td>${t.due_date ? formatDate(t.due_date) + (overdue ? ' ⚠️' : '') : '—'}</td>
            <td>
              ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick='openEditTaskModal(${JSON.stringify(t)}, ${isAdmin}, ${projectId}, ${JSON.stringify(members)})'>Edit</button>` : ''}
              ${isAdmin ? `<button class="btn btn-sm" style="background:#fee2e2;color:var(--danger);margin-left:4px" onclick="deleteTask(${t.id}, ${projectId})">Del</button>` : ''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}
