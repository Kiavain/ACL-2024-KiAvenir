import { addFlashMessages } from "../utils.js";

const otherAgendaButton = document.getElementById("otherAgenda");
const otherAgendaCloseButton = document.getElementById("otherAgenda-close-btn");
const modal = document.getElementById("otherAgendaModal");
const basic = document.getElementById("basic");
const zoneA = document.getElementById("zoneA");
const zoneB = document.getElementById("zoneB");
const zoneC = document.getElementById("zoneC");
const zoneCorse = document.getElementById("zoneCorse");
let shouldReaload = false;
// Vérifie si le document est chargé
document.addEventListener("DOMContentLoaded", () => {
  otherAgendaButton.onclick = () => openModal();
  otherAgendaCloseButton.onclick = () => reload();
  basic.onclick = () => importHoliday(basic);
  zoneA.onclick = () => importHoliday(zoneA);
  zoneB.onclick = () => importHoliday(zoneB);
  zoneC.onclick = () => importHoliday(zoneC);
  zoneCorse.onclick = () => importHoliday(zoneCorse);

  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target === modal) {
      window.removeEventListener("click", handleClickOutside);
      reload();
    }
  });
});
function reload() {
  if (shouldReaload) {
    window.location.reload();
  } else {
    modal.style.display = "none";
  }
}
function openModal() {
  // Afficher la modale
  modal.style.display = "block";
}

function importHoliday(elem) {
  const data = {
    lien: elem.getAttribute("data-link")
  };
  if (!elem.checked) {
    removeHoliday(elem, elem.getAttribute("data-name"));
    return;
  }
  const loader = document.getElementById("loader");
  loader.style.display = "block"; // Affiche le loader
  elem.disabled = true;

  // Cache le loader après 2 secondes
  setTimeout(() => {
    loader.style.display = "none";
    elem.disabled = false;
  }, 2000);
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
        shouldReaload = true;
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
function removeHoliday(elem, name) {
  const data = {
    name: name
  };
  const loader = document.getElementById("loader");
  loader.style.display = "block"; // Affiche le loader
  elem.disabled = true;

  // Cache le loader après 2 secondes
  setTimeout(() => {
    loader.style.display = "none";
    elem.disabled = false;
  }, 2000);
  fetch("/api/agenda/deleteHolidayAgenda", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        addFlashMessages(data.flashMessages);
        shouldReaload = true;
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
