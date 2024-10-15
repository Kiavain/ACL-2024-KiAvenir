document.addEventListener("DOMContentLoaded", () => {
  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const getInputValue = (id) => getElement(id).value;

  const popup = document.getElementById("agendaEventWindow");
  const createAgendaOrEvent = getElement("createAgendaOrEvent");
  createAgendaOrEvent.addEventListener("click", function () {
    popup.classList.toggle("show");
  });

  const createEvent = document.getElementById("createEvent");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-btn");
  const createButton = document.getElementById("saveEvent");

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
  createButton.onclick = (e) => {
    const name = getInputValue("event-name");
    const dateDebut = getInputValue("event-date");
    const description = getInputValue("event-description") ? null : " ";
    const dateFin = getInputValue("event-date-end");
    const agendaValue = getInputValue("event-agenda");
    const errorElement = getElement("date-error");
    let verifs = false;
    if (dateFin < dateDebut) {
      errorElement.style.display = "block";
      e.preventDefault();
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
        .catch((error) => console.error("Erreur:", error));
    }
  };
});
