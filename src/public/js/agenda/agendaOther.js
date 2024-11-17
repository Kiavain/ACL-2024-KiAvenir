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
  basic.onclick = () => importHoliday(basic.getAttribute("data-link"), basic.checked);
  zoneA.onclick = () => importHoliday(zoneA.getAttribute("data-link"), zoneA.checked);
  zoneB.onclick = () => importHoliday(zoneB.getAttribute("data-link"), zoneB.checked);
  zoneC.onclick = () => importHoliday(zoneC.getAttribute("data-link"), zoneC.checked);
  zoneCorse.onclick = () => importHoliday(zoneCorse.getAttribute("data-link"), zoneCorse.checked);

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

function importHoliday(lien, selected) {
  const data = {
    lien: lien
  };
  if (!selected) {
    removeHoliday(lien);
    return;
  }
  console.log("add");
  fetch("/api/agenda/importHolidayAgenda", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        addFlashMessages(data.flashMessages);
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
function removeHoliday(data) {
  console.log("remove");
}
