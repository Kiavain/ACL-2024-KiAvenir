import { addFlashMessages } from "../utils.js";
const importAgendaButton = document.getElementById("importAgenda");
const importAgendaConfirmButton = document.getElementById("importAgendaConfirm");
const importAgendaCloseButton = document.getElementById("importAgenda-close-btn");
const modal = document.getElementById("importAgendaModal");
// Vérifie si le document est chargé
document.addEventListener("DOMContentLoaded", () => {
  importAgendaCloseButton.onclick = () => (modal.style.display = "none");
  importAgendaButton.onclick = () => importAgenda();
  importAgendaConfirmButton.onclick = () => submitImportAgenda();

  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target === modal) {
      modal.style.display = "none";
      window.removeEventListener("click", handleClickOutside);
    }
  });
});

function importAgenda() {
  console.log("Ouverture du modal");
  modal.style.display = "block";
}

function submitImportAgenda() {
  console.log("Confirmation");
}
