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
  allDay.checked = false;

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

  const recurrenceSelect = document.getElementById("event-recurrence");
  const showRecurrencePanel = document.getElementById("show-recurrence-options");
  const recurrenceCustomSelect = document.getElementById("event-recurrence-custom");
  const recurrenceCustomInterval = document.getElementById("event-recurrence-interval");

  if (showRecurrencePanel) {
    showRecurrencePanel.style.display = "none";
  }

  if (recurrenceSelect) {
    recurrenceSelect.addEventListener("change", () => {
      if (parseInt(recurrenceSelect.value) === 5) {
        showRecurrencePanel.style.display = "flex";

        recurrenceCustomSelect.addEventListener("change", () => {
          handleCustomRecurrence();
        });

        recurrenceCustomInterval.addEventListener("input", () => {
          handleCustomRecurrence();
        });
      } else {
        showRecurrencePanel.style.display = "none";
      }
    });
  }

  function handleCustomRecurrence() {
    const unit = parseInt(recurrenceCustomSelect.value);
    const interval = parseInt(recurrenceCustomInterval.value);

    if (!isNaN(unit) && !isNaN(interval) && interval > 0) {
      return [unit, interval];
    } else {
      console.warn("Unité ou intervalle invalide.");
    }
  }

  createButton.onclick = (e) => {
    const stringAppend = getElement("event-all-day").checked ? "" : "+00:00";
    const name = getInputValue("event-name");
    const dateDebut = getInputValue("event-date") + stringAppend;
    const dateFin = getInputValue("event-date-end") + stringAppend;
    const description = getInputValue("event-description") || " ";
    const agendaValue = getInputValue("event-agenda");
    const errorElement = getElement("date-error");
    const errAgenda = getElement("agenda-error");
    const errName = getElement("name-error");
    const allDay = getElement("event-all-day");
    e.preventDefault();

    const startDateObj = new Date(dateDebut);
    const endDateObj = new Date(dateFin);

    errName.style.display = name.trim() ? "none" : "block";
    errAgenda.style.display = agendaValue ? "none" : "block";
    errorElement.style.display = startDateObj <= endDateObj ? "none" : "block";

    if (!name.trim()) {
      errName.style.display = "block";
      return;
    }
    // Vérifie la validité des dates
    if (!dateDebut || !dateFin || !agendaValue || startDateObj > endDateObj) {
      return;
    }
    const recurrenceValue = parseInt(recurrenceSelect.value, 10);
    if (![0, 1, 2, 3, 4, 5].includes(recurrenceValue)) {
      return;
    }

    const data = {
      name: name,
      agendaId: agendaValue,
      description: description,
      startDate: dateDebut,
      endDate: dateFin,
      allDay: allDay.checked,
      recurrence: recurrenceValue
    };

    const valRecurrences = handleCustomRecurrence();
    if (valRecurrences) {
      data["unit"] = valRecurrences[0];
      data["interval"] = valRecurrences[1];
    }

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
        setElementValue("event-description", "");
        errName.style.display = "none";
        errorElement.style.display = "none";
        errAgenda.style.display = "none";
        allDay.checked = false;

        refreshCalendar();
        addFlashMessages([data.message]);
      })
      .catch((error) => {
        console.error("Erreur lors de la requête:", error);
      });
  };
});
