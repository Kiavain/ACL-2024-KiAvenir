import { addFlashMessages } from "../utils.js";
import { refreshCalendar } from "./calendar.js";

document.addEventListener("DOMContentLoaded", () => {
  const createAgenda = document.getElementById("createAgenda");
  const viewCreateAgenda = document.getElementById("newAgenda");
  const close_vac = document.getElementById("closeViewAgendaCreation");
  const submitCreation = document.getElementById("saveAgenda");

  const getElement = (id) => document.getElementById(id);
  const getInputValue = (id) => getElement(id).value;
  createAgenda.onclick = () => {
    viewCreateAgenda.style.display = "block";
  };

  close_vac.addEventListener("click", () => {
    viewCreateAgenda.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === viewCreateAgenda) {
      viewCreateAgenda.style.display = "none";
    }
  });

  submitCreation.onclick = (e) => {
    e.preventDefault();
    const agendaCreationError = getElement("agenda-creation-error");

    const name = getInputValue("agenda-name");
    const description = getInputValue("agenda-description") || "Pas de détails disponibles.";
    const color = getInputValue("agenda-color") || "#2196f3";

    const data = {
      name: name,
      description: description,
      color: color
    };

    fetch("/api/agenda/create", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((data) => {
        addFlashMessages(data.flashMessages);
        if (data.success) {
          agendaCreationError.style.display = "none";
          viewCreateAgenda.style.display = "none";

          const selectedAgendaIds = Array.from(document.querySelectorAll(".agenda-checkbox:checked")).map(
            (checkbox) => checkbox.value
          );

          // Ajoute l'agenda créé à la liste des agendas sélectionnés
          selectedAgendaIds.push(data.agendaId);

          // Récupère les agendas
          fetch("/api/agenda/getAll")
            .then((response) => response.json())
            .then((data) => {
              const agendaList = document.getElementById("agenda-list");
              agendaList.innerHTML = data
                .filter((agenda) => !agenda.special)
                .map(
                  (agenda) => `
                <li class="agenda-item" data-description="${agenda.description}">
                  <input type="checkbox" checked=${selectedAgendaIds.includes(agenda.agendaId)} class="agenda-checkbox" value="${agenda.agendaId}" onclick="event.stopPropagation()" style="margin-right: 10px; font-size: 20px; color:${agenda.color}"/>
                  <a data-agenda-name="${agenda.name}" data-agenda-color="${agenda.color}" data-agenda-description="${agenda.description}" onclick="event.stopPropagation()">
                    <span style="color:${agenda.color}">${agenda.name}</span>
                  </a>
                  <button value="${agenda.agendaId}" class="icon-button" style="padding: 5px" onclick="event.stopPropagation()">
                    <span class="material-symbols-outlined" style="font-size: 20px;">more_vert</span>
                  </button>
                </li>
              `
                )
                .join("");

              document.querySelectorAll(".agenda-checkbox").forEach((checkbox) => {
                if (data.map((e) => e.agendaId).includes(checkbox.value)) {
                  checkbox.checked = true;
                }
              });

              // Sauvegarde les IDs des agendas sélectionnés dans le local storage
              localStorage.setItem("selectedAgendaIds", JSON.stringify(selectedAgendaIds));
              refreshCalendar();
            })
            .catch((error) => console.error("Erreur:", error));
          // Sauvegarde les IDs des agendas sélectionnés dans le local storage
          localStorage.setItem("selectedAgendaIds", JSON.stringify(selectedAgendaIds));
          refreshCalendar();
        } else {
          agendaCreationError.style.display = "block";
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };
});
