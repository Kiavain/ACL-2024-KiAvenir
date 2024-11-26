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
  const slidingPanel = document.getElementById("sliding-panel");
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
      left: "customButton prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    customButtons: {
      customButton: {
        text: "B",
        click: () => {
          // Toggle the sliding panel
          if (slidingPanel.classList.contains("open")) {
            slidingPanel.classList.remove("open");
            calendarEl.style.marginLeft = "0";
          } else {
            slidingPanel.classList.add("open");
            calendarEl.style.marginLeft = "300px";
          }
          calendar.updateSize();
        }
      }
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
  document.querySelector(".fc-customButton-button").innerHTML = "<i class=material-symbols-outlined>menu</i>";
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
  if (!eventData.allDay) {
    allDay.checked = false;
    startDate.type = "datetime-local";
    endDate.type = "datetime-local";
    startDate.value = moment(eventData.start).toISOString().substring(0, 16);
    endDate.value = moment(eventData.end).toISOString().substring(0, 16);
  } else {
    allDay.click();
    const startDateValue = moment(eventData.start).format("YYYY-MM-DD");
    let endDateValue = new Date(moment(eventData.end).format("YYYY-MM-DD"));
    // Soustraire un jour à la date de fin
    endDateValue.setUTCDate(endDateValue.getUTCDate() - 1);
    endDate.value = endDateValue.toISOString().split("T")[0];
    startDate.value = startDateValue;
  }

  // Définit la récurrence de l'event
  let recurrenceSelect = document.getElementById("eventRecurrence");
  let recurrence = eventData.extendedProps.recurrence;
  let recurrenceOptions = recurrenceSelect.children;

  for (let i = 0; i <= 4; i++) {
    recurrenceOptions[i].selected = false;
  }
  recurrenceOptions[recurrence].selected = true;

  const saveButton = document.getElementById("updateEvent");
  saveButton.dataset.eventId = eventData.extendedProps.eventId;

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

// Fonction pour mettre à jour un événement
export const saveEvent = (calendar) => {
  const saveButton = document.getElementById("updateEvent");
  const errorMessages = document.getElementById("error-update-event");
  const eventId = saveButton.dataset.eventId;
  const stringAppend = document.getElementById("eventAllDay").checked ? "" : "+00:00";
  const updatedData = {
    title: document.getElementById("eventTitle").value,
    description: document.getElementById("eventDetails").value,
    start: document.getElementById("startEventTime").value + stringAppend,
    end: document.getElementById("endEventTime").value + stringAppend,
    allDay: document.getElementById("eventAllDay").checked,
    recurrence: document.getElementById("eventRecurrence").value
  };
  if (!updatedData.title.trim()) {
    errorMessages.innerText = "Le champ titre est obligatoire.";
    return;
  }
  if (!updatedData.start || !updatedData.end) {
    errorMessages.innerText = "Les champs dates sont obligatoires.";
    return;
  }
  // Vérifie si la date de fin est supérieure à la date de début
  if (
    (new Date(updatedData.start) >= new Date(updatedData.end) && !updatedData.allDay) ||
    (new Date(updatedData.start) > new Date(updatedData.end) && updatedData.allDay)
  ) {
    errorMessages.innerText = "La date de fin doit être supérieure à la date de début.";
    return;
  }

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
        alert("Échec de la mise à jour de l'événement.");
      }
    })
    .catch((error) => console.error("Erreur:", error));
};

// Fonction pour supprimer un événement
export const deleteEvent = (calendar) => {
  const saveButton = document.getElementById("updateEvent");
  const eventId = saveButton.dataset.eventId;

  fetch(`/api/events/delete/${eventId}`, { method: "DELETE" })
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
