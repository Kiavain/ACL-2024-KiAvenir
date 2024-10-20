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
  const mailError = document.getElementById("mail-error");
  const roleError = document.getElementById("role-error");
  const otherError = document.getElementById("other-error");
  let isMailError = false;
  let isRoleError = false;
  let isOtherError = false;

  const data = {
    mail: mail,
    role: role
  };
  fetch(`/api/agenda/${agendaId}/shareAgenda`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => {
      //Vérifie la réponse d'erreur
      if (response.status === 400) {
        isMailError = true;
      } else if (response.status === 401) {
        isRoleError = true;
      } else if (response.status === 404) {
        isOtherError = true;
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        roleError.style.display = "none";
        mailError.style.display = "none";
        otherError.style.display = "none";
        window.location.href = "/agenda/" + agendaId;
      } else {
        if (isMailError) {
          mailError.textContent = data.message;
          mailError.style.display = "block";
        } else if (isRoleError) {
          roleError.style.display = "block";
        } else if (isOtherError) {
          otherError.style.display = "block";
        }
        console.log("ERREUR ????? " + data.message);
      }
    })
    .catch((error) => console.error("Erreur:", error));
}
