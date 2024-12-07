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
  const agendaIds = JSON.parse(localStorage.getItem('selectedAgendaIds')) || [];

  document.querySelectorAll('.agenda-checkbox').forEach((checkbox) => {
    if (agendaIds.some((id) => parseInt(id) === parseInt(checkbox.value))) {
      checkbox.checked = true;
    }
  });
});
