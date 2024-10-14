document.addEventListener("DOMContentLoaded", () => {
  const createAgendaOrEvent = document.getElementById("createAgendaOrEvent");
  const windowAgendaOrEvent = document.getElementById("agendaEventWindow");
  const createEvent = document.getElementById("createEvent");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-btn");
  const createButton = document.getElementById("saveEvent");

  // Utilitaires pour sélectionner les éléments
  const getElement = (id) => document.getElementById(id);
  const setInputValue = (id, value) => (getElement(id).value = value);
  const getInputValue = (id) => getElement(id).value;

  createAgendaOrEvent.onclick = () => {
    windowAgendaOrEvent.style.display = "block";
  };
  createEvent.onclick = () => {
    if (this.user !== null) {
      console.log("connecté");
    } else {
      console.log("pas connecté");
    }
    console.log("createEvent");
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
    if (name && dateDebut && description && dateFin) {
      const data = {
        name: name,
        agendaId: "1",
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
            alert("Événement CREER avec succès!");
            window.location.reload();
          } else {
            alert("Échec de la CREATION de l'événement.");
          }
        })
        .catch((error) => console.error("Erreur:", error));
    }
  };
});
