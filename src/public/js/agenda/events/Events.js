document.addEventListener("DOMContentLoaded", () => {
  const createAgendaOrEvent = document.getElementById("createAgendaOrEvent");
  const windowAgendaOrEvent = document.getElementById("agendaEventWindow");
  const createEvent = document.getElementById("createEvent");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("close-btn");

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
});
