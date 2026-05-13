// ─────────────────────────────────────────────────────────────
// Client-side router — maps page names to render functions
// ─────────────────────────────────────────────────────────────
function navigate(page, projectId) {
  state.currentPage      = page;
  state.currentProjectId = projectId || null;

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (page === 'dashboard') document.getElementById('nav-dashboard')?.classList.add('active');
  if (page === 'projects')  document.getElementById('nav-projects')?.classList.add('active');
  if (projectId)            document.getElementById('nav-proj-' + projectId)?.classList.add('active');

  // Dispatch to the correct render function
  if (page === 'dashboard')     renderDashboard();
  else if (page === 'projects') renderProjects();
  else if (page === 'project')  renderProject(projectId);
}
