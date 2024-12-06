// Initialiser la langue de moment.js

import { addFlashMessages } from "../utils.js";
moment.locale("fr");

export function refreshCalendar() {
  getCalendarInstance().setOption("events", getEventsUrl());
  getCalendarInstance().refetchEvents();
}

export function getEventsUrl() {
  let selectedAgendaIds = Array.from(document.querySelectorAll(".agenda-checkbox:checked"))
    .map((checkbox) => checkbox.value)
    .join(",");

  // Vérifie aussi l'agendaId présent dans l'URL
  const url = new URL(window.location.href);
  const agendaId = url.pathname.split("/").pop();
  if (agendaId && !selectedAgendaIds.includes(agendaId)) {
    selectedAgendaIds += `,${agendaId}`;
  }

  const search = document.getElementById("searchInput").value;
  const input = search && search.trim() !== "" ? `?search=${search}` : "";
  return `/api/events/${selectedAgendaIds}${input}`;
}

let calendarInstance = null;

// Fonction pour créer et initialiser le calendrier
export const initCalendar = () => {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) {
    console.error("Element #calendar non trouvé");
    return null;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "fr",
    timeZone: "UTC",
    noEventsContent: "Aucun événement disponible",
    firstDay: 1,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    buttonText: {
      today: "Aujourd'hui",
      month: "Mois",
      week: "Semaine",
      day: "Jour",
      list: "Liste"
    },
    events: getEventsUrl(),
    eventDataTransform: (eventData) => {
      return {
        ...eventData,
        color: eventData.color,
        allDay: eventData.allDay
      };
    },
    eventClick: (info) => {
      openModal(info.event);
    },
    eventDidMount: function (info) {
      info.el.style.backgroundColor = info.event.backgroundColor;
      info.el.classList.remove("fc-list-event");
    },
    dateClick: function (info) {
      const modal = document.getElementById("modal");
      const name = document.getElementById("event-name");
      const startDate = document.getElementById("event-date");
      const endDate = document.getElementById("event-date-end");
      const allDay = document.getElementById("event-all-day");
      const agenda = document.getElementById("event-agenda");
      const description = document.getElementById("event-description");
      startDate.type = info.allDay ? "date" : "datetime-local";
      endDate.type = startDate.type;
      startDate.value = info.dateStr;
      endDate.value = info.dateStr;
      allDay.checked = info.allDay;
      agenda.value = agenda.options[0].value;
      name.value = "";
      description.value = "";

      if (!info.allDay) {
        startDate.value = moment(info.dateStr).toISOString().substring(0, 16);
        endDate.value = moment(info.dateStr).add(1, "hour").toISOString().substring(0, 16);
      }

      modal.style.display = "block";
    }
  });

  calendarInstance = calendar;

  calendar.render();
  listenFilter(calendar);
  return calendar; // Retourner l'instance du calendrier pour l'utiliser ailleurs
};

// Fonction pour obtenir l'instance du calendrier
export const getCalendarInstance = () => {
  if (!calendarInstance) {
    console.warn("Le calendrier n'est pas encore initialisé.");
  }
  return calendarInstance;
};

// Fonction pour ouvrir la modale
export const openModal = (eventData) => {
  const modal = document.getElementById("eventModal");
  if (!modal) {
    return;
  }
  const allDay = document.getElementById("eventAllDay");
  const startDate = document.getElementById("startEventTime");
  const endDate = document.getElementById("endEventTime");

  allDay.addEventListener("click", () => {
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
  document.getElementById("eventTitle").value = eventData.title;
  document.getElementById("eventDetails").value = eventData.extendedProps.description || "Pas de détails disponibles.";
  allDay.checked = false;
  if (eventData.allDay) {
    allDay.click();
    const startDateValue = moment(eventData.start).format("YYYY-MM-DD");

    // Calculer end uniquement si eventData.end est défini
    let endDateValue = eventData.end ? moment(eventData.end).subtract(1, "days").format("YYYY-MM-DD") : startDateValue;

    startDate.value = startDateValue;
    endDate.value = endDateValue;
  } else {
    startDate.value = moment(eventData.start).toISOString().substring(0, 16);
    endDate.value = moment(eventData.end).toISOString().substring(0, 16);
  }

  // Définit la récurrence de l'event
  let recurrenceSelect = document.getElementById("eventRecurrence");
  const showRecPanel = document.getElementById("showRecurrenceOptionsEdit");
  const recurrenceCustomSelect = document.getElementById("eventRecurrenceCustom");
  const recurrenceCustomInterval = document.getElementById("eventRecurrenceInterval");

  let recurrence = eventData.extendedProps.recurrence ?? 5; // Si l'événement n'a pas de récurrence, il s'agit d'une récurrence personnalisée

  let unit = eventData.extendedProps.unit ?? 0;
  let interval = eventData.extendedProps.interval ?? 2;
  recurrenceCustomSelect.value = unit;
  recurrenceCustomInterval.value = interval;

  // Custom de la récurrence
  if (showRecPanel && recurrence !== 5) {
    showRecPanel.style.display = "none";
  } else {
    showRecPanel.style.display = "flex";
  }

  if (recurrenceSelect) {
    recurrenceSelect.addEventListener("change", () => {
      if (parseInt(recurrenceSelect.value) === 5) {
        showRecPanel.style.display = "flex";

        recurrenceCustomSelect.addEventListener("change", () => {
          handleCustomRecurrence();
        });

        recurrenceCustomInterval.addEventListener("input", () => {
          handleCustomRecurrence();
        });
      } else {
        showRecPanel.style.display = "none";
      }
    });
  }

  function handleCustomRecurrence() {
    const unit = parseInt(recurrenceCustomSelect.value);
    const interval = recurrenceCustomInterval.value;

    if (!isNaN(unit) && !isNaN(interval) && interval > 0) {
      return [unit, interval];
    } else {
      console.warn("Les champs de récurrence personnalisée doivent être des nombres entiers positifs.");
    }
  }

  recurrenceSelect.value = recurrence;

  const optionApplyToAll = document.getElementById("optionApplyToAll");
  if (recurrence !== 4) {
    optionApplyToAll.style.display = "flex";
  } else {
    optionApplyToAll.style.display = "none";
  }

  const saveButton = document.getElementById("updateEvent");
  saveButton.dataset.eventId = eventData.extendedProps.eventId;
  saveButton.dataset.occurrenceId = eventData.extendedProps.occurrenceId;
  saveButton.dataset.oldRecurrence = eventData.extendedProps.recurrence;

  modal.style.display = "block";
};

//Fonction pour écouter la barre de filtrage des évenements
const listenFilter = (calendar) => {
  document.getElementById("searchInput").addEventListener("input", function () {
    calendar.setOption("events", getEventsUrl());
    calendar.refetchEvents();
  });
};

// Fonction pour fermer la modale
export const closeModal = () => {
  const modal = document.getElementById("eventModal");
  modal.style.display = "none";
};

// Fonction pour gérer la fermeture du menu contextuel
export const handleOutsideClick = (event) => {
  const modal = document.getElementById("eventModal");
  if (event.target === modal) {
    closeModal();
  }
};

export const saveEvent = (calendar) => {
  const saveButton = document.getElementById("updateEvent");
  const errorMessages = document.getElementById("error-update-event");
  let eventId = saveButton.dataset.eventId;
  let sentId = eventId;

  const stringAppend = document.getElementById("eventAllDay").checked ? "" : "+00:00";
  const applyToAll = document.getElementById("applyToAllOccurrences").checked;
  const oldRecurrence = saveButton.dataset.oldRecurrence;

  const updatedData = {
    title: document.getElementById("eventTitle").value.trim(),
    description: document.getElementById("eventDetails").value.trim(),
    start: document.getElementById("startEventTime").value + stringAppend,
    end: document.getElementById("endEventTime").value + stringAppend,
    allDay: document.getElementById("eventAllDay").checked,
    recurrence: document.getElementById("eventRecurrence").value,
    occurrence: 0, // Par défaut, c'est un événement principal
    applyToAll: applyToAll,
    sentId: sentId,
    oldRecurrence: oldRecurrence
  };

  // Vérifie si une récurrence personnalisée est activée
  let rec = updatedData.recurrence;
  if (rec === "5") {
    const unit = document.getElementById("eventRecurrenceCustom").value;
    const interval = document.getElementById("eventRecurrenceInterval").value;

    eventId = saveButton.dataset.occurrenceId;
    updatedData.sentId = eventId;
    updatedData.unit = parseInt(unit, 10);
    updatedData.interval = parseInt(interval, 10);
    updatedData.occurrence = 1; // Marque comme une occurrence

    if (
      isNaN(updatedData.unit) ||
      isNaN(updatedData.interval) ||
      updatedData.interval < 1 ||
      updatedData.interval > 30
    ) {
      errorMessages.innerText = "Les champs doivent être des nombres entiers positifs.";
      return;
    }
  } else if ((rec === "0" || rec === "1" || rec === "2" || rec === "3") && oldRecurrence !== "4") {
    eventId = saveButton.dataset.occurrenceId;
    updatedData.sentId = eventId;
    updatedData.occurrence = 1; // Marque comme une occurrence
    updatedData.unit = rec;
    updatedData.interval = 1;
  }

  if (!updatedData.title) {
    errorMessages.innerText = "Le champ titre est obligatoire.";
    return;
  }
  if (!updatedData.start || !updatedData.end) {
    errorMessages.innerText = "Les champs dates sont obligatoires.";
    return;
  }

  // Vérifie la cohérence des dates
  const startDate = new Date(updatedData.start);
  const endDate = new Date(updatedData.end);
  if ((startDate >= endDate && !updatedData.allDay) || (startDate > endDate && updatedData.allDay)) {
    errorMessages.innerText = "La date de fin doit être supérieure à la date de début.";
    return;
  }

  console.log("Données envoyées :", updatedData);

  fetch(`/api/events/update/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        calendar.refetchEvents();
        closeModal();
        addFlashMessages(["Événement mis à jour avec succès"]);
      } else {
        errorMessages.innerText = data.message || "Échec de la mise à jour de l'événement.";
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      errorMessages.innerText = "Une erreur est survenue lors de la mise à jour.";
    });
};

// Fonction pour supprimer un événement
export const deleteEvent = (calendar) => {
  const saveButton = document.getElementById("updateEvent");
  let eventId = saveButton.dataset.eventId;
  const recurrence = document.getElementById("eventRecurrence").value;
  const applyToAll = document.getElementById("applyToAllOccurrences").checked;

  const deleteNature = {
    recurrence: recurrence,
    applyToAll: applyToAll
  };

  if (Number(recurrence) !== 4) {
    eventId = saveButton.dataset.occurrenceId;
  }

  fetch(`/api/events/delete/${eventId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deleteNature)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        calendar.refetchEvents();
        window.location.reload();
      } else {
        alert("Échec de la suppression de l'événement.");
      }
    })
    .catch((error) => console.error("Erreur:", error));
};
