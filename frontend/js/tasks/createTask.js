// ─────────────────────────────────────────────────────────────
// Create task modal
// ─────────────────────────────────────────────────────────────

function openCreateTaskModal(projectId, members) {
  const memberOptions = members
    .map(m => `<option value="${m.user_id}">${esc(m.name)} (${esc(m.email)})</option>`)
    .join('');

  openModal(`
    <h2>New Task</h2>
    <div id="modal-err" class="error-msg hidden"></div>
    <div class="form-group">
      <label>Title *</label>
      <input id="m-title" type="text" placeholder="Task title"/>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="m-desc" placeholder="Optional details"></textarea>
    </div>
    <div class="form-group">
      <label>Assigned To</label>
      <select id="m-assign"><option value="">Unassigned</option>${memberOptions}</select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Status</label>
        <select id="m-status">
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="m-priority">
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Due Date</label>
      <input id="m-due" type="date"/>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createTask(${projectId})">Create Task</button>
    </div>
  `);
}

async function createTask(projectId) {
  const title    = document.getElementById('m-title').value.trim();
  const desc     = document.getElementById('m-desc').value.trim();
  const assignTo = document.getElementById('m-assign').value;
  const status   = document.getElementById('m-status').value;
  const priority = document.getElementById('m-priority').value;
  const dueDate  = document.getElementById('m-due').value;
  const errEl    = document.getElementById('modal-err');

  if (!title) {
    errEl.textContent = 'Title is required.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    await apiCreateTask(projectId, {
      title,
      description: desc || undefined,
      assigned_to: assignTo ? parseInt(assignTo) : undefined,
      status,
      priority,
      due_date: dueDate || undefined,
    });
    closeModal();
    toast('Task created!');
    renderProject(projectId);
  } catch (err) {
    errEl.textContent = err.error || 'Failed to create task.';
    errEl.classList.remove('hidden');
  }
}
