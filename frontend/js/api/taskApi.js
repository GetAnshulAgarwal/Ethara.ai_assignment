import { api } from './api.js';

export function getProjectTasks(projectId) {
  return api('GET', `/tasks/project/${projectId}`);
}

export function createTask(projectId, data) {
  return api('POST', `/tasks/project/${projectId}`, data);
}