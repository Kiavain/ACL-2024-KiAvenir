const shareAgendaButton = document.getElementById("shareAgenda");
const shareAgendaCloseButton = document.getElementById("shareAgenda-close-btn");
const modal = document.getElementById("shareAgendaModal");

shareAgendaCloseButton.onclick = function () {
  modal.style.display = "none";
};

shareAgendaButton.addEventListener("click", () => {
  shareAgenda();
});

function shareAgenda() {
  const agendaId = document.getElementById("shareOrExport").value;
  console.log("Id de l'agenda à partager : " + agendaId);
  modal.style.display = "block";
}
