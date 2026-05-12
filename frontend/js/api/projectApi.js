import { api } from './api.js';

export function getProjects() {
  return api('GET', '/projects');
}

export function createProject(data) {
  return api('POST', '/projects', data);
}