export async function renderProject(projectId) {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="card">
      <h2>Project ${projectId}</h2>
    </div>
  `;
}