document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const closeButton = modal.querySelector(".close");

  moment.locale("fr");

  // Fonction pour ouvrir la modale avec les détails de l'événement
  const openModal = (eventData) => {
    console.log(eventData);
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
    }
  };

  // Écouteur d'événements pour chaque événement
  document.querySelectorAll(".event-item").forEach((item) => {
    item.addEventListener("click", () => {
      let clickTimeout;

      // Si un clic a déjà été détecté, on annule le timeout pour ne pas exécuter le simple clic
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      } else {
        // Si aucun double clic n'est détecté dans le délai, on exécute le simple clic
        clickTimeout = setTimeout(() => {
          clickTimeout = null;
        }, 300); // Délai de 300ms pour attendre un éventuel double clic
      }
    });

    item.addEventListener("dblclick", () => {
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
