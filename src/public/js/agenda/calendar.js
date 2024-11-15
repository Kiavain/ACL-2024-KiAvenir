// Initialiser la langue de moment.js

import { addFlashMessages } from "../utils.js";
moment.locale("fr");

function getEventsUrl(agenda) {
  const selectedAgendaIds = Array.from(document.querySelectorAll(".agenda-checkbox:checked"))
    .map((checkbox) => checkbox.value)
    .join(",");

  const search = document.getElementById("searchInput").value;
  const input = search && search.trim() !== "" ? `?search=${search}` : "";
  if (!selectedAgendaIds) {
    return `/api/events/${agenda.agendaId}${input}`;
  }

  return `/api/events/${selectedAgendaIds}${input}`;
}

// Fonction pour créer et initialiser le calendrier
export const initCalendar = (agenda) => {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) {
    console.error("Element #calendar non trouvé");
    return null;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "fr",
    noEventsContent: "Aucun événement disponible",
    firstDay: 1,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,listWeek"
    },
    buttonText: {
      today: "Aujourd'hui",
      month: "Mois",
      week: "Semaine",
      day: "Jour",
      list: "Liste"
    },
    events: getEventsUrl(agenda),
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
      if (info.view.type === "listWeek") {
        info.el.style.backgroundColor = info.event.backgroundColor;
        info.el.classList.remove("fc-list-event");
      }
    },
    dateClick: function (info) {
      const modal = document.getElementById("modal");
      const startDate = document.getElementById("event-date");
      const endDate = document.getElementById("event-date-end");
      const allDay = document.getElementById("event-all-day");
      startDate.type = info.allDay ? "date" : "datetime-local";
      endDate.type = startDate.type;
      startDate.value = info.dateStr;
      endDate.value = info.dateStr;
      allDay.checked = info.allDay;

      if (!info.allDay) {
        startDate.value = info.dateStr.replace("+01:00", "");
        endDate.value = moment(startDate.value).add(2, "hour").toISOString().substring(0, 16);
      }

      modal.style.display = "block";
    }
  });

  // Recharge les événements chaque fois qu'une case est cochée/décochée
  document.querySelectorAll(".agenda-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      calendar.setOption("events", getEventsUrl(agenda));
      calendar.refetchEvents(); // Recharge les événements
    });
  });

  calendar.render();
  listenFilter(calendar, agenda);
  return calendar; // Retourner l'instance du calendrier pour l'utiliser ailleurs
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
  const now = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  const nowWithoutHours = new Date().toISOString().split("T")[0];
  allDay.addEventListener("click", () => {
    if (allDay.checked) {
      startDate.type = "date";
      endDate.type = "date";
      startDate.min = nowWithoutHours;
      endDate.min = nowWithoutHours;
    } else {
      startDate.type = "datetime-local";
      endDate.type = "datetime-local";
      startDate.min = now;
      endDate.min = now;
    }
  });
  document.getElementById("eventTitle").value = eventData.title;
  document.getElementById("eventDetails").value = eventData.extendedProps.description || "Pas de détails disponibles.";
  allDay.checked = false;
  if (!eventData.allDay) {
    allDay.checked = false;
    startDate.type = "datetime-local";
    endDate.type = "datetime-local";
    startDate.min = now;
    endDate.min = now;
    startDate.value = moment(eventData.start).add(1, "hour").toISOString().substring(0, 16);
    endDate.value = moment(eventData.end).add(1, "hour").toISOString().substring(0, 16);
  } else {
    allDay.click();
    const startDateValue = moment(eventData.start).format("YYYY-MM-DD");
    let endDateValue = new Date(moment(eventData.end).format("YYYY-MM-DD"));
    // Soustraire un jour à la date de fin
    endDateValue.setUTCDate(endDateValue.getUTCDate() - 1);
    endDate.value = endDateValue.toISOString().split("T")[0];
    startDate.value = startDateValue;
  }
  const saveButton = document.getElementById("updateEvent");
  saveButton.dataset.eventId = eventData.extendedProps.eventId;

  modal.style.display = "block";
};
//Fonction pour écouter la barre de filtrage des évenements
const listenFilter = (calendar, agenda) => {
  document.getElementById("searchInput").addEventListener("input", function () {
    calendar.setOption("events", getEventsUrl(agenda));
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

  const updatedData = {
    title: document.getElementById("eventTitle").value,
    description: document.getElementById("eventDetails").value,
    start: document.getElementById("startEventTime").value,
    end: document.getElementById("endEventTime").value,
    allDay: document.getElementById("eventAllDay").checked
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
