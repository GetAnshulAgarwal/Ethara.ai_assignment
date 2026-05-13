// ─────────────────────────────────────────────────────────────
// Edit / delete task
// ─────────────────────────────────────────────────────────────

function openEditTaskModal(task, isAdmin, projectId, members) {
  const memberOptions = members
    .map(m => `<option value="${m.user_id}" ${task.assigned_to == m.user_id ? 'selected' : ''}>${esc(m.name)}</option>`)
    .join('');

  openModal(`
    <h2>Edit Task</h2>
    <div id="modal-err" class="error-msg hidden"></div>
    <div class="form-group">
      <label>Title</label>
      <input id="m-title" type="text" value="${esc(task.title)}"/>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="m-desc">${esc(task.description || '')}</textarea>
    </div>
    ${isAdmin ? `
      <div class="form-group">
        <label>Assigned To</label>
        <select id="m-assign"><option value="">Unassigned</option>${memberOptions}</select>
      </div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Status</label>
        <select id="m-status">
          <option value="todo"        ${task.status === 'todo'        ? 'selected' : ''}>To Do</option>
          <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="done"        ${task.status === 'done'        ? 'selected' : ''}>Done</option>
        </select>
      </div>
      ${isAdmin ? `
        <div class="form-group">
          <label>Priority</label>
          <select id="m-priority">
            <option value="low"    ${task.priority === 'low'    ? 'selected' : ''}>Low</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high"   ${task.priority === 'high'   ? 'selected' : ''}>High</option>
          </select>
        </div>` : ''}
    </div>
    ${isAdmin ? `
      <div class="form-group">
        <label>Due Date</label>
        <input id="m-due" type="date" value="${task.due_date ? task.due_date.substring(0,10) : ''}"/>
      </div>` : ''}
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="updateTask(${task.id}, ${projectId}, ${isAdmin})">Save</button>
    </div>
  `);
}

async function updateTask(taskId, projectId, isAdmin) {
  const errEl   = document.getElementById('modal-err');
  const payload = {};

  const titleEl  = document.getElementById('m-title');
  if (titleEl)  payload.title       = titleEl.value.trim();
  const descEl   = document.getElementById('m-desc');
  if (descEl)   payload.description = descEl.value.trim();
  const statusEl = document.getElementById('m-status');
  if (statusEl) payload.status      = statusEl.value;

  if (isAdmin) {
    const assignEl = document.getElementById('m-assign');
    if (assignEl) payload.assigned_to = assignEl.value ? parseInt(assignEl.value) : null;
    const prioEl   = document.getElementById('m-priority');
    if (prioEl)   payload.priority    = prioEl.value;
    const dueEl    = document.getElementById('m-due');
    if (dueEl)    payload.due_date    = dueEl.value || null;
  }

  try {
    await apiUpdateTask(taskId, payload);
    closeModal();
    toast('Task updated!');
    renderProject(projectId);
    if (state.currentPage === 'dashboard') renderDashboard();
  } catch (err) {
    errEl.textContent = err.error || 'Failed to update task.';
    errEl.classList.remove('hidden');
  }
}

async function deleteTask(taskId, projectId) {
  if (!confirm('Delete this task?')) return;
  try {
    await apiDeleteTask(taskId);
    toast('Task deleted.');
    renderProject(projectId);
  } catch (err) {
    toast(err.error || 'Delete failed.');
  }
}
