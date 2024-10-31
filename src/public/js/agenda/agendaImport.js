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
  const importError = document.getElementById("file-error");
  const file = document.getElementById("file-import");
  if (!file.value || file.value === "") {
    importError.textContent = "Veuillez sélectionner un fichier à importer.";
    importError.style.display = "block";
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  fetch("/api/agenda/importAgenda", {
    method: "PUT",
    body: formData
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        importError.style.display = "none";
        addFlashMessages(data.flashMessages);
        modal.style.display = "none";
      } else {
        importError.textContent = data.message || "Erreur lors de l'importation.";
        importError.style.display = "block";
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
