document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const closeButton = modal.querySelector(".close");

  // Fonction pour ouvrir la modale avec les détails de l'événement
  const openModal = (eventData) => {
    document.getElementById("eventTitle").innerText = eventData.title;
    document.getElementById("eventDetails").innerText =
      eventData.details || "Pas de détails disponibles.";
    document.getElementById("eventTime").innerText =
      `${eventData.start} à ${eventData.end}`;
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
      const parsedData = JSON.parse(item.dataset.event);
      openModal(parsedData);
    });
  });
});
