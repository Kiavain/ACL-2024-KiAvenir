// Initialiser la langue de moment.js
import { addFlashMessage } from "./events/Events.js";
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
        color: eventData.color
      };
    },
    eventClick: (info) => {
      openModal(info.event);
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

  document.getElementById("eventTitle").value = eventData.title;
  document.getElementById("eventDetails").value = eventData.extendedProps.description || "Pas de détails disponibles.";
  document.getElementById("startEventTime").value = moment(eventData.start)
    .add(1, "hour")
    .toISOString()
    .substring(0, 16);
  document.getElementById("endEventTime").value = moment(eventData.end).add(1, "hour").toISOString().substring(0, 16);

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
    end: document.getElementById("endEventTime").value
  };

  // Vérifie si la date de fin est supérieure à la date de début
  if (new Date(updatedData.start) >= new Date(updatedData.end)) {
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
        addFlashMessage("Événement mis à jour avec succès");
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
