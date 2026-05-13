// ─────────────────────────────────────────────────────────────
// Create project modal
// ─────────────────────────────────────────────────────────────

function openCreateProjectModal() {
  openModal(`
    <h2>New Project</h2>
    <div id="modal-err" class="error-msg hidden"></div>
    <div class="form-group">
      <label>Name *</label>
      <input id="m-name" type="text" placeholder="Project name"/>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="m-desc" placeholder="Optional description"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createProject()">Create</button>
    </div>
  `);
}

async function createProject() {
  const name  = document.getElementById('m-name').value.trim();
  const desc  = document.getElementById('m-desc').value.trim();
  const errEl = document.getElementById('modal-err');

  if (!name) {
    errEl.textContent = 'Name is required.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    await apiCreateProject(name, desc);
    closeModal();
    toast('Project created!');
    loadSidebarProjects();
    renderProjects();
  } catch (err) {
    errEl.textContent = err.error || 'Failed to create project.';
    errEl.classList.remove('hidden');
  }
}
