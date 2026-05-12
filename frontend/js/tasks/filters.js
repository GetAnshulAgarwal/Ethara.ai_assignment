export function filterTasks(tasks, filter) {
  return tasks.filter(task => task.status === filter);
}