
document.addEventListener("DOMContentLoaded", () => {
  const createAgendaOrEvent = document.getElementById("createAgendaOrEvent");
  const windowAgendaOrEvent = document.getElementById("agendaEventWindow");
  const createEvent = document.getElementById("createEvent");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-btn");
  const createButton = document.getElementById("saveEvent");

  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const getInputValue = (id) => getElement(id).value;

  createAgendaOrEvent.onclick = () => {
    windowAgendaOrEvent.style.display = "block";
  };
  createEvent.onclick = () => {
    modal.style.display = "block";
  };

  // Fermer la fenêtre modale
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fermer la fenêtre en cliquant en dehors de celle-ci
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
  createButton.onclick = () => {
    const name = getInputValue("event-name");
    const dateDebut = getInputValue("event-date");
    const description = getInputValue("event-description") ? null : " ";
    const dateFin = getInputValue("event-date-end");
    const agendaValue = getInputValue("event-agenda");
    const errorElement = getElement("date-error");
    let verifs = false;
    if (dateFin < dateDebut) {
      errorElement.style.display = "block";
      event.preventDefault();
    } else {
      errorElement.style.display = "none";
      verifs = true;
    }
    if (
      verifs === true &&
      name &&
      dateDebut &&
      description &&
      dateFin &&
      agendaValue
    ) {
      const data = {
        name: name,
        agendaId: agendaValue,
        description: description,
        startDate: dateDebut,
        endDate: dateFin
      };
      fetch("/api/events/create", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            window.location.reload();
            //Mettre un pop-up de succès
          }
        })
        .catch((error) => console.error("Erreur:", error));
    }
  };
});
