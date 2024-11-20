import { refreshCalendar } from "./calendar.js";

document.addEventListener("DOMContentLoaded", function () {
  // Fonction pour mettre à jour la route avec les IDs des agendas sélectionnés
  function updateURL() {
    const selectedAgendaIds = Array.from(document.querySelectorAll(".agenda-checkbox:checked")).map(
      (checkbox) => checkbox.value
    );

    // Sauvegarde les IDs des agendas sélectionnés dans le local storage
    localStorage.setItem("selectedAgendaIds", JSON.stringify(selectedAgendaIds));

    // Actualise le calendrier
    refreshCalendar();
  }

  // Mise à jour automatique de l'URL => cocher/décocher une case
  document.querySelectorAll(".agenda-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", updateURL);
  });

  //  Récupère les IDs des agendas sélectionnés dans le local storage
  const selectedAgendaIds = localStorage.getItem("selectedAgendaIds");
  if (selectedAgendaIds) {
    const agendaIds = JSON.parse(selectedAgendaIds);
    const firstAgenda = window.location.pathname.split("/")[2].split(",")[0];

    document.querySelectorAll(".agenda-checkbox").forEach((checkbox) => {
      if (agendaIds.includes(checkbox.value) || firstAgenda === checkbox.value) {
        checkbox.checked = true;
        checkbox.disabled = firstAgenda === checkbox.value;
      }
    });
  }
});
