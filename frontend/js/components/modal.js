export function openModal(content) {
  const modal = document.getElementById('modal-overlay');

  modal.classList.remove('hidden');

  modal.innerHTML = `
    <div class="modal">
      ${content}
    </div>
  `;
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}