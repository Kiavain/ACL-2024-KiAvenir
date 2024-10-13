document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const contextMenu = document.getElementById("eventContextMenu");
  const closeButton = modal.querySelector(".close");

  moment.locale("fr");

  // Fonction pour ouvrir la modale avec les détails de l'événement
  const openModal = (eventData) => {
    document.getElementById("eventTitle").innerText = eventData.name;
    document.getElementById("eventDetails").innerText =
      eventData.description || "Pas de détails disponibles.";
    document.getElementById("eventTime").innerText = formatEventPeriod(
      moment(eventData.startDate),
      moment(eventData.endDate)
    );
    modal.style.display = "block";
  };

  // Événement pour fermer la modale
  closeButton.onclick = () => {
    modal.style.display = "none";
  };

  // Événement pour fermer la modale en cliquant en dehors de celle-ci
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    } else if (event.target !== contextMenu) {
      contextMenu.style.display = "none";
    }
  };

  // Clic gauche sur un événement pour le sélectionner
  document.querySelectorAll(".event-item").forEach((item) => {
    item.addEventListener("click", () => {
      let clickTimeout;

      // Si un second  clic a déjà été détecté, on annule le timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      } else {
        clickTimeout = setTimeout(() => {
          // TODO: Sélectionner/Désélectionner l'événement
          clickTimeout = null;
        }, 300); // Délai de 300ms pour attendre un éventuel double clic
      }
    });

    // Double clic sur un événement pour ouvrir les détails
    item.addEventListener("dblclick", () => {
      openModal(JSON.parse(item.dataset.event));
    });

    // Clic droit sur un événement pour ouvrir le menu contextuel
    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();

      const eventData = JSON.parse(item.dataset.event);
      contextMenu.style.display = "block";
      contextMenu.style.left = `${event.clientX}px`;
      contextMenu.style.top = `${event.clientY}px`;

      const detailsButton = document.getElementById("detailsEvent");
      detailsButton.onclick = () => {
        openModal(eventData);
        contextMenu.style.display = "none";
      };

      const deleteButton = document.getElementById("deleteEvent");
      deleteButton.onclick = () => {
        fetch(`/api/events/delete/${eventData.eventId}`, {
          method: "GET"
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              window.location.reload();
              contextMenu.style.display = "none";
            }
          });
      };
    });
  });
});

// Fonction pour capitaliser la première lettre
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatEventPeriod(start, end) {
  // Formatage avec un mois capitalisé
  const startFormatted = `Le ${start.format("D")} ${capitalizeFirstLetter(start.format("MMMM YYYY"))} de ${start.format("HH:mm")}`;
  const endFormatted = `${end.format("HH:mm")}`;

  if (start.isSame(end, "day")) {
    return `${startFormatted} à ${endFormatted}`;
  } else {
    return `Du ${start.format("D")} ${capitalizeFirstLetter(start.format("MMMM YYYY à HH:mm"))} au ${end.format("D")} ${capitalizeFirstLetter(end.format("MMMM YYYY à HH:mm"))}`;
  }
}
