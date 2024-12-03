import { addFlashMessages } from "../utils.js";

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

    console.log("Création de l'agenda...");
    const name = getInputValue("agenda-name");
    const description = getInputValue("agenda-description") || "Pas de détails disponibles.";
    const color = getInputValue("agenda-color") || "#2196f3";

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
        addFlashMessages(data.flashMessages);
        if (data.success) {
          agendaCreationError.style.display = "none";
          viewCreateAgenda.style.display = "none";
          window.location.href = "/agenda/" + data.agendaId;
        } else {
          agendaCreationError.style.display = "block";
          console.log(data.message);
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };
});
