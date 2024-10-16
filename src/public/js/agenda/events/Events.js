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
    const description = getInputValue("event-description") || " ";
    const dateFin = getInputValue("event-date-end");
    const agendaValue = getInputValue("event-agenda");
    const errorElement = getElement("date-error");
    let verifs = false;
    e.preventDefault();

    if (dateFin < dateDebut) {
      errorElement.style.display = "block";
    } else {
      errorElement.style.display = "none";
      verifs = true;
    }
    if (verifs === true && name && dateDebut && description && dateFin && agendaValue) {
      const data = {
        name: name,
        agendaId: agendaValue,
        description: description,
        startDate: dateDebut,
        endDate: dateFin
      };

      modal.style.display = "none";
      popup.classList.toggle("show");

      fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          addFlashMessage(data.message);
        })
        .catch((error) => {
          console.error("Erreur lors de la requête:", error);
        });
    }
  };
});

function addFlashMessage(message) {
  const flashContainer = document.querySelector(".flash-container"); // Le conteneur existant

  const flashMessage = document.createElement("div");
  flashMessage.className = "alert-notif";
  flashMessage.innerText = message;

  flashContainer.appendChild(flashMessage);

  // Affiche avec un timer, comme dans le script existant
  setTimeout(() => {
    flashMessage.remove();
  }, 3000); // 3 secondes
}
