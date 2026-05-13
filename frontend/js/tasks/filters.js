// ─────────────────────────────────────────────────────────────
// Task filters (status + priority dropdowns on project detail)
// ─────────────────────────────────────────────────────────────

async function filterTasks(projectId) {
  const status   = document.getElementById('filter-status').value;
  const priority = document.getElementById('filter-priority').value;

  try {
    const [data, projData] = await Promise.all([
      apiGetTasks(projectId, { status, priority }),
      apiGetProject(projectId),
    ]);
    document.getElementById('tasks-table').innerHTML = renderTasksTable(
      data.tasks,
      projData.project.my_role === 'admin',
      projectId,
      projData.members
    );
  } catch {}
}
