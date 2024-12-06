import { addFlashMessages } from "../utils.js";
import { notifyServer } from "../websocket.js";

const editAgendaButton = document.getElementById("editAgenda");
const deleteAgendaButton = document.getElementById("deleteAgenda");
const editAgendaModal = document.getElementById("editAgendaModal");
const deleteAgendaModal = document.getElementById("deleteAgendaModal");
const closeEditAgendaButton = document.getElementById("closeEditAgenda");
const editAgendaForm = document.getElementById("editAgendaForm");
const confirmDeleteButton = document.getElementById("confirmDeleteAgenda");
const closeDeleteModal = document.getElementById("closeDeleteAgenda");
const deleteMessage = document.getElementById("deleteMessage");

if (deleteAgendaButton) {
  deleteAgendaButton.onclick = function () {
    deleteAgendaModal.style.display = "block";
    deleteMessage.textContent = "";
  };

  confirmDeleteButton.onclick = async function () {
    const agendaId = document.getElementById("shareOrExport").value;
    const response = await fetch(`/api/agenda/${agendaId}/delete`, {
      method: "DELETE"
    });

    if (response.ok) {
      notifyServer({ type: "update", message: "Deleting agenda" });
      window.location.href = "/agenda"; // Note : Les notifications sont traitées
    } else {
      const data = await response.json();
      deleteMessage.textContent = data.message;
    }
  };

  closeDeleteModal.onclick = function () {
    deleteAgendaModal.style.display = "none";
  };
}

if (editAgendaButton) {
  editAgendaButton.onclick = function () {
    editAgendaModal.style.display = "block";
  };
}

closeEditAgendaButton.onclick = function () {
  editAgendaModal.style.display = "none";
};

editAgendaForm.onsubmit = async function (e) {
  e.preventDefault();
  const agendaId = document.getElementById("shareOrExport").value;
  const newAgendaName = document.getElementById("new-agenda-name").value;
  const newAgendaColor = document.getElementById("new-agenda-color").value;
  const newAgendaDescription = document.getElementById("new-agenda-description").value;

  fetch(`/api/agenda/${agendaId}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: newAgendaName, color: newAgendaColor, description: newAgendaDescription })
  })
    .then((response) => response.json())
    .then((data) => {
      addFlashMessages(data.flashMessages);

      agenda.name = newAgendaName;
      agenda.color = newAgendaColor;
      agenda.description = newAgendaDescription;

      editAgendaModal.style.display = "none";
      notifyServer({ type: "update", message: "Updating agenda" });
      location.reload(); // Note : Notification prise en charge par le serveur
    })
    .catch((error) => console.error("Erreur:", error));
};

document.onclick = function (event) {
  // Si on clique en dehors de la modale, on la ferme
  if (event.target === editAgendaModal) {
    editAgendaModal.style.display = "none";
  } else if (event.target === deleteAgendaModal) {
    deleteAgendaModal.style.display = "none";
  }
};
