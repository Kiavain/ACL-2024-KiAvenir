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
    const response = await fetch(`/api/agenda/${agenda.agendaId}/delete`, {
      method: "DELETE"
    });

    if (response.ok) {
      window.location.href = "/agenda";
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
    document.getElementById("new-agenda-name").value = agenda.name;
  };
}

closeEditAgendaButton.onclick = function () {
  editAgendaModal.style.display = "none";
};

editAgendaForm.onsubmit = async function (e) {
  e.preventDefault();
  const newAgendaName = document.getElementById("new-agenda-name").value;

  // Vérifie que le nom n'est pas vide et qu'il n'est pas déjà pris
  const response = await fetch(`/api/agenda/${agenda.agendaId}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: newAgendaName })
  });

  if (response.ok) {
    // Met à jour le nom de l'agenda sur la page sans recharger
    agenda.name = newAgendaName;
    document.querySelector(".header-title").textContent = newAgendaName;
    editAgendaModal.style.display = "none";

    // Met à jour le nom de l'agenda dans la liste déroulante des agendas pour les évènements
    const selectEvents = document.getElementById("event-agenda");
    const agendaOptions = selectEvents.options;
    for (let i = 0; i < agendaOptions.length; i++) {
      if (agendaOptions[i].value === agenda.agendaId) {
        agendaOptions[i].text = agenda.name;
        console.log("agendaOptionId : " + agendaOptions[i].value);
        console.log("agendaId : " + agenda.agendaId);
        break;
      }
    }
  } else {
    alert("Erreur lors de la mise à jour : le nom est peut-être déjà pris ou vide.");
  }
};

document.onclick = function (event) {
  // Si on clic en dehors de la modale, on la ferme
  if (event.target === editAgendaModal) {
    editAgendaModal.style.display = "none";
  } else if (event.target === deleteAgendaModal) {
    deleteAgendaModal.style.display = "none";
  }
};
