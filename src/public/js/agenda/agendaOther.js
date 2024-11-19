import { addFlashMessages } from "../utils.js";

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
  basic.onclick = () => importHoliday(basic);
  zoneA.onclick = () => importHoliday(zoneA);
  zoneB.onclick = () => importHoliday(zoneB);
  zoneC.onclick = () => importHoliday(zoneC);
  zoneCorse.onclick = () => importHoliday(zoneCorse);

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
        // Créer un nouvel élément <li>
        const newAgenda = document.createElement("li");
        newAgenda.classList.add("agenda-item");
        newAgenda.style.justifyContent = "unset";

        newAgenda.style.backgroundColor = "rgba(0, 123, 255, 0.2)";
        newAgenda.style.color = "white";

        // Créer l'input checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("agenda-checkbox");
        checkbox.value = data.newAgenda.agendaId;
        checkbox.onclick = (event) => event.stopPropagation();
        checkbox.style.marginRight = "10px";
        checkbox.style.fontSize = "20px";
        checkbox.style.color = data.newAgenda.color;

        // Créer le lien
        const link = document.createElement("a");
        link.href = `/agenda/${data.newAgenda.agendaId}`;
        link.dataset.agendaName = data.newAgenda.name;
        link.onclick = (event) => event.stopPropagation();

        const span = document.createElement("span");
        span.textContent = data.newAgenda.name;
        span.style.color = data.newAgenda.color;

        link.appendChild(span);
        newAgenda.appendChild(checkbox);
        newAgenda.appendChild(link);
        newAgenda.setAttribute("data-agenda-name", data.newAgenda.name);

        // Ajouter le nouvel élément <li> à la liste
        const agendaList = document.getElementById("other-agenda-list");
        agendaList.appendChild(newAgenda);
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
        const liElement = document.querySelector(`li[data-agenda-name="${name}"]`);
        console.log(liDropDown);
        if (liElement) {
          liElement.querySelector("input").click();
          liElement.remove();
        }
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
