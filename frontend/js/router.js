import { renderDashboard } from './dashboard/dashboard.js';
import { renderProjects } from './projects/projects.js';
import { renderProject } from './projects/projectDetails.js';

export function navigate(page, projectId = null) {
  if (page === 'dashboard') renderDashboard();
  if (page === 'projects') renderProjects();
  if (page === 'project') renderProject(projectId);
}