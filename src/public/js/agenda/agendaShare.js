const shareAgendaButton = document.getElementById("shareAgenda");
const shareAgendaConfirmButton = document.getElementById("shareAgendaConfirm");
const shareAgendaCloseButton = document.getElementById("shareAgenda-close-btn");
const modal = document.getElementById("shareAgendaModal");

shareAgendaCloseButton.onclick = function () {
  modal.style.display = "none";
};

shareAgendaButton.addEventListener("click", () => {
  shareAgenda();
});

shareAgendaConfirmButton.addEventListener("click", () => {
  submitShareAgenda();
});

function shareAgenda() {
  const agendaId = document.getElementById("shareOrExport").value;
  console.log("Id de l'agenda à partager : " + agendaId);
  modal.style.display = "block";
}

function submitShareAgenda() {
  const agendaId = document.getElementById("shareOrExport").value;
  const mail = document.getElementById("email-share").value;
  const role = document.getElementById("role-share-agenda").value;
  console.log("Shared Agenda numéro : " + agendaId + ", mail du destinataire " + mail + ", rôle : " + role);

  const data = {
    mail: mail,
    role: role
  };
  fetch(`/api/agenda/${agendaId}/shareAgenda`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/agenda/" + agendaId;
      } else {
        console.log("ERREUR ????? " + data.message);
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
