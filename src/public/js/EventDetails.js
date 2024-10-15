document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const contextMenu = document.getElementById("eventContextMenu");
  const closeButton = modal.querySelector(".close");
  const saveButton = document.getElementById("saveEvent");

  moment.locale("fr");

  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const setInputValue = (id, value) => (getElement(id).value = value);
  const getInputValue = (id) => getElement(id).value;

  // Fonction pour ouvrir la modale et afficher les détails de l'événement
  const openModal = (eventData) => {
    setInputValue("eventTitle", eventData.name);
    setInputValue(
      "eventDetails",
      eventData.description || "Pas de détails disponibles."
    );
    setInputValue(
      "startEventTime",
      moment(eventData.startDate).add(2, "hours").toISOString().substring(0, 16)
    );
    setInputValue(
      "endEventTime",
      moment(eventData.endDate).add(2, "hours").toISOString().substring(0, 16)
    );

    saveButton.dataset.eventId = eventData.eventId;
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
    } else if (event.target !== contextMenu) {
      contextMenu.style.display = "none";
    }
  };

  // Fonction pour enregistrer les modifications d'un événement
  const saveEvent = () => {
    const eventId = saveButton.dataset.eventId;
    const updatedData = {
      name: getInputValue("eventTitle"),
      description: getInputValue("eventDetails"),
      startDate: getInputValue("startEventTime"),
      endDate: getInputValue("endEventTime")
    };

    fetch(`/api/events/update/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Événement mis à jour avec succès!");
          window.location.reload();
        } else {
          alert("Échec de la mise à jour de l'événement.");
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };

  // Fonction pour gérer le clic sur un événement
  const handleEventClick = (item, clickTimeout) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    } else {
      clickTimeout = setTimeout(() => {
        // TODO: Sélectionner/Désélectionner l'événement
        clickTimeout = null;
      }, 300);
    }
  };

  // Fonction pour afficher le menu contextuel
  const showContextMenu = (event, item) => {
    event.preventDefault();
    const eventData = JSON.parse(item.dataset.event);

    contextMenu.style.display = "block";
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;

    getElement("detailsEvent").onclick = () => {
      openModal(eventData);
      contextMenu.style.display = "none";
    };

    getElement("deleteEvent").onclick = () => {
      fetch(`/api/events/delete/${eventData.eventId}`, { method: "DELETE" })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            window.location.reload();
          }
        });
    };
  };

  // Initialisation des événements sur les éléments de la page
  const initEventListeners = () => {
    document.querySelectorAll(".event-item").forEach((item) => {
      let clickTimeout;

      // Clic gauche pour sélectionner un événement
      item.addEventListener("click", () =>
        handleEventClick(item, clickTimeout)
      );

      // Double clic pour ouvrir la modale avec les détails
      item.addEventListener("dblclick", () => {
        openModal(JSON.parse(item.dataset.event));
      });

      // Clic droit pour ouvrir le menu contextuel
      item.addEventListener("contextmenu", (event) => {
        showContextMenu(event, item);
      });
    });

    closeButton.onclick = closeModal;
    window.onclick = handleOutsideClick;
    saveButton.onclick = saveEvent;
  };

  // Initialisation des gestionnaires d'événements
  initEventListeners();
});
