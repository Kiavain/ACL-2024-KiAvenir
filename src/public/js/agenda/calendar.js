document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const closeButton = modal.querySelector(".close");
  const saveButton = document.getElementById("updateEvent");
  const deleteButton = document.getElementById("deleteEvent");

  moment.locale("fr");

  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const setInputValue = (id, value) => (getElement(id).value = value);
  const getInputValue = (id) => getElement(id).value;

  // Fonction pour ouvrir la modale et afficher les détails de l'événement
  const openModal = (eventData) => {
    setInputValue("eventTitle", eventData.title);
    setInputValue("eventDetails", eventData.extendedProps.description || "Pas de détails disponibles.");
    setInputValue("startEventTime", moment(eventData.start).add(2, "hour").toISOString().substring(0, 16));
    setInputValue("endEventTime", moment(eventData.end).add(2, "hour").toISOString().substring(0, 16));

    saveButton.dataset.eventId = eventData.extendedProps.eventId;
    modal.style.display = "block";
  };

  // Fonction pour fermer la modale
  const closeModal = () => {
    modal.style.display = "none";
  };

  // Fonction pour gérer la fermeture du menu contextuel
  const handleOutsideClick = (event) => {
    if (event.target === modal) {
      closeModal();
    }
  };

  // Fonction pour enregistrer les modifications d'un événement
  const saveEvent = (fullCalendar) => {
    const eventId = saveButton.dataset.eventId;
    const updatedData = {
      title: getInputValue("eventTitle"),
      description: getInputValue("eventDetails"),
      start: getInputValue("startEventTime"),
      end: getInputValue("endEventTime")
    };

    fetch(`/api/events/update/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          fullCalendar.refetchEvents();
          alert("Événement mis à jour avec succès!");
          window.location.reload();
        } else {
          alert("Échec de la mise à jour de l'événement.");
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };

  const deleteEvent = (fullCalendar) => {
    const eventId = saveButton.dataset.eventId;

    fetch(`/api/events/delete/${eventId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          fullCalendar.refetchEvents();
          window.location.reload();
        } else {
          alert("Échec de la suppression de l'événement.");
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };

  // Initialisation du calendrier FullCalendar
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) {
    return;
  }

  // Récupère les événements depuis l'API pour les afficher dans le calendrier
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
    // Demande les événements à l'API avec un agendaId facultatif
    events: `/api/events/${agenda.agendaId}`,
    eventClick: (info) => {
      openModal(info.event); // Double clic pour ouvrir la modale
    }
  });

  setInterval(() => {
    calendar.refetchEvents();
  }, 1000);

  calendar.render();

  closeButton.onclick = closeModal;
  window.onclick = handleOutsideClick;

  // Rendre le calendrier responsive lors du redimensionnement
  window.addEventListener("resize", () => {
    calendar.updateSize(); // Met à jour la taille du calendrier
  });

  saveButton.onclick = () => saveEvent(calendar);
  deleteButton.onclick = () => deleteEvent(calendar);
});
