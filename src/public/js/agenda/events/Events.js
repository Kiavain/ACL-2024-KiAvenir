import { refreshCalendar } from "../calendar.js";
import { addFlashMessages } from "../../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const getInputValue = (id) => getElement(id).value;
  const setElementValue = (id, value) => (getElement(id).value = value);

  const popup = document.getElementById("agendaEventWindow");
  const createAgendaOrEvent = getElement("createAgendaOrEvent");
  createAgendaOrEvent.addEventListener("click", function () {
    popup.classList.toggle("show");
  });

  const createEvent = document.getElementById("createEvent");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-btn");
  const createButton = document.getElementById("saveEvent");
  const allDay = getElement("event-all-day");

  //Change le format de la date en all day, sans heures
  allDay.addEventListener("click", () => {
    const startDate = getElement("event-date");
    const endDate = getElement("event-date-end");
    if (allDay.checked) {
      const newStartDate = startDate.value.split("T")[0];
      startDate.type = "date";
      endDate.type = "date";
      startDate.value = newStartDate;
      endDate.value = startDate.value;
    } else {
      const newStartDate = startDate.value + "T07:00";
      const newEndDate = startDate.value + "T08:00";
      startDate.type = "datetime-local";
      endDate.type = "datetime-local";
      startDate.value = newStartDate;
      endDate.value = newEndDate;
    }
  });
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
    const stringAppend = getElement("event-all-day").checked ? "" : "+00:00";
    const name = getInputValue("event-name");
    // ajouter +00 parce que la date est en utc et sinon Date() pense que c'est en local
    const dateDebut = getInputValue("event-date") + stringAppend;
    const description = getInputValue("event-description") || " ";
    const dateFin = getInputValue("event-date-end") + stringAppend;
    const agendaValue = getInputValue("event-agenda");
    const errorElement = getElement("date-error");
    const errAgenda = getElement("agenda-error");
    const errName = getElement("name-error");
    const allDay = getElement("event-all-day");
    const recurrence = getElement("event-recurrence");
    e.preventDefault();

    errName.style.display = agendaValue ? "none" : "block";
    errorElement.style.display = name <= dateFin ? "none" : "block";
    errAgenda.style.display = agendaValue ? "none" : "block";

    if (!name.trim()) {
      errName.style.display = "block";
      return;
    }
    // Vérifie la validité des dates
    if (!dateDebut || !dateFin || !agendaValue || dateDebut > dateFin || (dateDebut === dateFin && !allDay.checked)) {
      return;
    }
    // Vérifie la valeur de l'entier recurrence (il ne peut valoir qu'un entier de 0 à 4)
    if (recurrence.value != 0 && recurrence.value != 1 && recurrence.value != 2 && recurrence.value != 3 && recurrence.value != 4) {
      return;
    }

    const data = {
      name: name,
      agendaId: agendaValue,
      description: description,
      startDate: dateDebut,
      endDate: dateFin,
      allDay: allDay.checked,
      recurrence: recurrence.value
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
        // Réinitialise le formulaire
        setElementValue("event-name", "");
        setElementValue("event-date", "");
        setElementValue("event-date-end", "");
        setElementValue("event-description", "");
        errName.style.display = "none";
        errorElement.style.display = "none";
        errAgenda.style.display = "none";

        refreshCalendar();
        addFlashMessages([data.message]);
      })
      .catch((error) => {
        console.error("Erreur lors de la requête:", error);
      });
  };
});
