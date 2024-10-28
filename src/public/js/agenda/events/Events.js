import { initCalendar } from "../calendar.js";
import { addFlashMessages } from "../../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const getInputValue = (id) => getElement(id).value;

  const popup = document.getElementById("agendaEventWindow");
  const createAgendaOrEvent = getElement("createAgendaOrEvent");
  createAgendaOrEvent.addEventListener("click", function () {
    popup.classList.toggle("show");
  });

  const createEvent = document.getElementById("createEvent");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-btn");
  const createButton = document.getElementById("saveEvent");

  createEvent.onclick = () => {
    modal.style.display = "block";
  };

  // Fermer la fenêtre modale
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fermer la fenêtre en cliquant en dehors de celle-ci
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
    if (
      !createAgendaOrEvent.contains(event.target) &&
      !popup.contains(event.target) &&
      popup.classList.contains("show")
    ) {
      popup.classList.toggle("show");
    }
  });

  createButton.onclick = (e) => {
    const name = getInputValue("event-name");
    const dateDebut = getInputValue("event-date");
    const description = getInputValue("event-description") || " ";
    const dateFin = getInputValue("event-date-end");
    const agendaValue = getInputValue("event-agenda");
    const errorElement = getElement("date-error");
    const errAgenda = getElement("agenda-error");
    const errName = getElement("name-error");
    e.preventDefault();

    errName.style.display = agendaValue ? "none" : "block";
    errorElement.style.display = name <= dateFin ? "none" : "block";
    errAgenda.style.display = agendaValue ? "none" : "block";

    // Vérifie la validité des dates
    if (!name || !dateDebut || !dateFin || !agendaValue || dateDebut > dateFin) {
      return;
    }

    const data = {
      name: name,
      agendaId: agendaValue,
      description: description,
      startDate: dateDebut,
      endDate: dateFin
    };

    modal.style.display = "none";
    popup.classList.toggle("show");

    fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        initCalendar(agenda);
        addFlashMessages([data.message]);
      })
      .catch((error) => {
        console.error("Erreur lors de la requête:", error);
      });
  };
});
