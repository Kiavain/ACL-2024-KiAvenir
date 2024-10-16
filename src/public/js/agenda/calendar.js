// Initialiser la langue de moment.js
moment.locale("fr");

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
    eventColor: agenda.color,
    events: `/api/events/${agenda.agendaId}`,
    eventClick: (info) => {
      openModal(info.event);
    }
  });

  calendar.render();
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
    .add(2, "hour")
    .toISOString()
    .substring(0, 16);
  document.getElementById("endEventTime").value = moment(eventData.end).add(2, "hour").toISOString().substring(0, 16);

  const saveButton = document.getElementById("updateEvent");
  saveButton.dataset.eventId = eventData.extendedProps.eventId;

  modal.style.display = "block";
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
  const eventId = saveButton.dataset.eventId;

  const updatedData = {
    title: document.getElementById("eventTitle").value,
    description: document.getElementById("eventDetails").value,
    start: document.getElementById("startEventTime").value,
    end: document.getElementById("endEventTime").value
  };

  fetch(`/api/events/update/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        calendar.refetchEvents();
        alert("Événement mis à jour avec succès!");
        window.location.reload();
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
