import { addFlashMessages } from '../utils.js';
const importAgendaButton = document.getElementById('importAgenda');
const importAgendaConfirmButton = document.getElementById('importAgendaConfirm');
const importAgendaCloseButton = document.getElementById('importAgenda-close-btn');
const modal = document.getElementById('importAgendaModal');
// Vérifie si le document est chargé
document.addEventListener('DOMContentLoaded', () => {
  importAgendaCloseButton.onclick = () => (modal.style.display = 'none');
  importAgendaButton.onclick = () => importAgenda();
  importAgendaConfirmButton.onclick = () => submitImportAgenda();

  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener('click', function handleClickOutside(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
      window.removeEventListener('click', handleClickOutside);
    }
  });
});

function importAgenda() {
  modal.style.display = 'block';
}

function submitImportAgenda() {
  const importError = document.getElementById('file-error');
  const fileInput = document.getElementById('file-import');
  const file = fileInput.files[0]; // Récupère le fichier directement
  if (!file) {
    importError.textContent = 'Veuillez sélectionner un fichier à importer.';
    importError.style.display = 'block';
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  fetch('/api/agenda/importAgenda', {
    method: 'PUT',
    body: formData
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        importError.style.display = 'none';
        modal.style.display = 'none';
        window.location.reload(); // Note : Notification prise en charge par le serveur
      } else {
        importError.textContent = data.message || "Erreur lors de l'importation.";
        importError.style.display = 'block';
      }
    })
    .catch((error) => console.error('Erreur:', error));
}
