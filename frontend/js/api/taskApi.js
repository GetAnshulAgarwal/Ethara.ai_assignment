// ─────────────────────────────────────────────────────────────
// Task API
// ─────────────────────────────────────────────────────────────

async function apiGetDashboard() {
  return api('GET', '/tasks/dashboard');
}

async function apiGetTasks(projectId, filters = {}) {
  let qs = '';
  if (filters.status)   qs += `status=${filters.status}&`;
  if (filters.priority) qs += `priority=${filters.priority}&`;
  return api('GET', `/tasks/project/${projectId}?${qs}`);
}

async function apiCreateTask(projectId, payload) {
  return api('POST', `/tasks/project/${projectId}`, payload);
}

async function apiUpdateTask(taskId, payload) {
  return api('PUT', `/tasks/${taskId}`, payload);
}

async function apiDeleteTask(taskId) {
  return api('DELETE', `/tasks/${taskId}`);
}
