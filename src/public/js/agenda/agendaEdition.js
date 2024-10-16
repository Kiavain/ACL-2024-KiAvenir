console.log("Agenda ID:", agenda.agendaId);

const editAgendaButton = document.getElementById("editAgenda");
const editAgendaModal = document.getElementById("editAgendaModal");
const closeEditAgendaButton = document.getElementById("closeEditAgenda");
const editAgendaForm = document.getElementById("editAgendaForm");

editAgendaButton.onclick = function () {
  editAgendaModal.style.display = "block";
  document.getElementById("new-agenda-name").value = agenda.name;
};

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
  } else {
    alert(
      "Erreur lors de la mise à jour : le nom est peut-être déjà pris ou vide."
    );
  }
};

window.onclick = function (event) {
  if (event.target === editAgendaModal) {
    editAgendaModal.style.display = "none";
  }
};
