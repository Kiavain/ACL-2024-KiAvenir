import { addFlashMessages } from "../utils.js";
const otherAgendaButton = document.getElementById("otherAgenda");
const otherAgendaCloseButton = document.getElementById("otherAgenda-close-btn");
const modal = document.getElementById("otherAgendaModal");
// Vérifie si le document est chargé
document.addEventListener("DOMContentLoaded", () => {
  otherAgendaButton.onclick = () => openModal();
  otherAgendaCloseButton.onclick = () => (modal.style.display = "none");

  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target === modal) {
      modal.style.display = "none";
      window.removeEventListener("click", handleClickOutside);
    }
  });
});
function openModal() {
  // Afficher la modale
  modal.style.display = "block";
}
