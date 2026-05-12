export function toast(message) {
  const toast = document.getElementById('toast');

  toast.innerHTML = `<div>${message}</div>`;
}