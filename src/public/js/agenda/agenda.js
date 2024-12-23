import { initCalendar, saveEvent, deleteEvent, closeModal, handleOutsideClick } from './calendar.js';
import { addFlashMessages } from '../utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const closeButton = document.querySelector('.close');
  const saveButton = document.getElementById('updateEvent');
  const deleteButton = document.getElementById('deleteEvent');
  const deletePreviewButton = document.getElementById('deleteEventPreview');

  // Initialisation du calendrier
  const calendar = initCalendar();

  // Si le calendrier est bien initialisé
  if (calendar) {
    closeButton.onclick = closeModal;
    window.onclick = handleOutsideClick;

    if (new URLSearchParams(window.location.search).has('today')) {
      calendar.changeView('timeGridDay');
    }

    saveButton.onclick = () => {
      // Récupère les dates de début et de fin
      let startDate = document.getElementById('startEventTime').value;
      let endDate = document.getElementById('endEventTime').value;

      if (startDate === '' || endDate === '') {
        addFlashMessages(['Veuillez renseigner les dates de début et de fin.']);
        return;
      }

      // Convertir les dates en objet Date
      startDate = moment(startDate).add(1, 'h').toISOString().substring(0, 16);
      endDate = moment(endDate).add(1, 'h').toISOString().substring(0, 16);

      saveEvent(startDate, endDate);
    };
    deleteButton.onclick = () => deleteEvent(calendar);
    deletePreviewButton.onclick = () => deleteEvent(calendar);

    // Rendre le calendrier responsive lors du redimensionnement
    window.addEventListener('resize', () => {
      calendar.updateSize();
    });
  }
});
