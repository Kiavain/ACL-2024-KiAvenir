import { refreshCalendar } from './calendar.js';

document.addEventListener('DOMContentLoaded', function () {
  // Fonction pour mettre à jour la route avec les IDs des agendas sélectionnés
  function updateURL() {
    const selectedAgendaIds = Array.from(document.querySelectorAll('.agenda-checkbox:checked')).map(
      (checkbox) => checkbox.value
    );

    // Sauvegarde les IDs des agendas sélectionnés dans le local storage
    localStorage.setItem('selectedAgendaIds', JSON.stringify(selectedAgendaIds));

    // Actualise le calendrier
    refreshCalendar();
  }

  // Mise à jour automatique de l'URL => cocher/décocher une case
  document.querySelectorAll('.agenda-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', updateURL);
  });

  //  Récupère les IDs des agendas sélectionnés dans le local storage
  const selectedAgendaIds = localStorage.getItem('selectedAgendaIds');
  let firstAgendaId = `${agenda.agendaId}`;
  let agendaIds = [];
  if (selectedAgendaIds) {
    agendaIds = JSON.parse(selectedAgendaIds);
    if (agendaIds.length === 0) {
      agendaIds.push(firstAgendaId);
    }
  } else {
    agendaIds.push(firstAgendaId);
  }

  document.querySelectorAll('.agenda-checkbox').forEach((checkbox) => {
    if (agendaIds.some((id) => id == checkbox.value)) {
      checkbox.checked = true;
    }
  });
});
