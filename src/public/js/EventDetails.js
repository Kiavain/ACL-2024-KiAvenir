document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const closeButton = modal.querySelector(".close");

  moment.locale("fr");

  // Fonction pour ouvrir la modale avec les détails de l'événement
  const openModal = (eventData) => {
    document.getElementById("eventTitle").innerText = eventData.title;
    document.getElementById("eventDetails").innerText =
      eventData.details || "Pas de détails disponibles.";
    document.getElementById("eventTime").innerText = formatEventPeriod(
      moment(eventData.start),
      moment(eventData.end)
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
    }
  };

  // Écouteur d'événements pour chaque événement
  document.querySelectorAll(".event-item").forEach((item) => {
    item.addEventListener("click", () => {
      openModal(JSON.parse(item.dataset.event));
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
