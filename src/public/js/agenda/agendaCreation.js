document.addEventListener("DOMContentLoaded", () => {
  const createAgenda = document.getElementById("createAgenda");
  const viewCreateAgenda = document.getElementById("newAgenda");
  const close_vac = document.getElementById("closeViewAgendaCreation");
  const submitCreation = document.getElementById("saveAgenda");

  const getElement = (id) => document.getElementById(id);
  const getInputValue = (id) => getElement(id).value;
  createAgenda.onclick = () => {
    viewCreateAgenda.style.display = "block";
  };

  close_vac.addEventListener("click", () => {
    viewCreateAgenda.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === viewCreateAgenda) {
      viewCreateAgenda.style.display = "none";
    }
  });

  submitCreation.onclick = (e) => {
    e.preventDefault();
    const agendaCreationError = getElement("agenda-creation-error");

    const name = getInputValue("agenda-name");
    const description = getInputValue("agenda-description") || "Pas de détails disponibles.";
    const color = getInputValue("agenda-color") || "#2196f3";

    // Empêche les agendas au nom vide
    if (!name.trim()) {
      agendaCreationError.style.display = "block";
      return;
    }

    const data = {
      name: name,
      description: description,
      color: color
    };

    fetch("/api/agenda/create", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          agendaCreationError.style.display = "none";
          viewCreateAgenda.style.display = "none";

          // Met à jour la sélection des agendas
          const oldSelection = JSON.parse(localStorage.getItem("selectedAgendaIds"));
          if (oldSelection) {
            oldSelection.push(data.agendaId);
            localStorage.setItem("selectedAgendaIds", JSON.stringify(oldSelection));
          } else {
            localStorage.setItem("selectedAgendaIds", JSON.stringify([data.agendaId]));
          }

          window.location.reload(); // Note : Notification prise en charge par le serveur
        } else {
          agendaCreationError.style.display = "block";
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };
});
