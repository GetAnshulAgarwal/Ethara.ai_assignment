export function renderTopbar(title) {
  const topbar = document.getElementById('topbar');

  topbar.innerHTML = `<h2>${title}</h2>`;
}