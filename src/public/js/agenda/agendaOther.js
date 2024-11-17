import {addFlashMessages} from "../utils.js";

const otherAgendaButton = document.getElementById("otherAgenda");
const otherAgendaCloseButton = document.getElementById("otherAgenda-close-btn");
const modal = document.getElementById("otherAgendaModal");
const basic = document.getElementById("basic");
const zoneA = document.getElementById("zoneA");
const zoneB = document.getElementById("zoneB");
const zoneC = document.getElementById("zoneC");
const zoneCorse = document.getElementById("zoneCorse");
// Vérifie si le document est chargé
document.addEventListener("DOMContentLoaded", () => {
  otherAgendaButton.onclick = () => openModal();
  otherAgendaCloseButton.onclick = () => (modal.style.display = "none");
  basic.onclick = () => importHolliday(basic.getAttribute("data-link"), basic.checked);
  zoneA.onclick = () => importHolliday(zoneA.getAttribute("data-link"), zoneA.checked);
  zoneB.onclick = () => importHolliday(zoneB.getAttribute("data-link"), zoneB.checked);
  zoneC.onclick = () => importHolliday(zoneC.getAttribute("data-link"), zoneC.checked);
  zoneCorse.onclick = () => importHolliday(zoneCorse.getAttribute("data-link"), zoneCorse.checked);

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
  document.getElementById("dropdown-menu").style.display = "none";
}

function importHolliday(lien,selected) {
  const data = {
    lien: lien
  };
  if (!selected) {
    removeHolliday(lien);
    return;
  }
  console.log("add");
  /*
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
   */
}
function removeHolliday(data) {
  console.log("remove");
}
