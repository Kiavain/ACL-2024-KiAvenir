import { addFlashMessages } from "../utils.js";
const exportAgendaButton = document.getElementById("exportAgenda");
const exportAgendaConfirmButton = document.getElementById("exportAgendaConfirm");
const exportAgendaCloseButton = document.getElementById("exportAgenda-close-btn");
const modal = document.getElementById("exportAgendaModal");
let exportAgendaId = null;
// Vérifie si le document est chargé
document.addEventListener("DOMContentLoaded", () => {
  exportAgendaCloseButton.onclick = () => (modal.style.display = "none");
  exportAgendaButton.onclick = () => exportAgenda();
  exportAgendaConfirmButton.onclick = () => submitExportAgenda();

  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target === modal) {
      modal.style.display = "none";
      window.removeEventListener("click", handleClickOutside);
    }
  });
});

function exportAgenda() {
  exportAgendaId = document.getElementById("shareOrExport").value;
  // Afficher la modale
  modal.style.display = "block";
}

function submitExportAgenda() {
  const exportError = document.getElementById("format-error");
  let isExportError = false;
  const format = document.getElementById("format-export").value;
  const data = {
    format: format
  };
  fetch(`/api/agenda/${exportAgendaId}/exportAgenda`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => {
      //Vérifie la réponse d'erreur
      if (response.status === 400) {
        isExportError = true;
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        exportError.style.display = "none";
        addFlashMessages(data.flashMessages);
        modal.style.display = "none";
      } else {
        if (isExportError) {
          exportError.textContent = data.message;
          exportError.style.display = "block";
        }
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
