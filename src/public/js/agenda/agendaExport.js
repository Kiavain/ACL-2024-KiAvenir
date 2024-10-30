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
  console.log("exportAgenda");
  exportAgendaId = document.getElementById("shareOrExport").value;
  console.log("ID de l'agenda à exporter :" + exportAgendaId);
  // Afficher la modale
  modal.style.display = "block";
}

function submitExportAgenda() {
  console.log("Exportation de l'agenda en cours numéro :" + exportAgendaId);
}
