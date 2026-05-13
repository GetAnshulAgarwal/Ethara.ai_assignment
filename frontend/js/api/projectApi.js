// ─────────────────────────────────────────────────────────────
// Project API
// ─────────────────────────────────────────────────────────────

async function apiGetProjects() {
  return api('GET', '/projects');
}

async function apiGetProject(projectId) {
  return api('GET', `/projects/${projectId}`);
}

async function apiCreateProject(name, description) {
  return api('POST', '/projects', { name, description });
}

async function apiAddMember(projectId, email, role) {
  return api('POST', `/projects/${projectId}/members`, { email, role });
}

async function apiRemoveMember(projectId, userId) {
  return api('DELETE', `/projects/${projectId}/members/${userId}`);
}
