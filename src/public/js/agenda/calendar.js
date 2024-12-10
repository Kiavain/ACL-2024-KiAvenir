// Initialiser la langue de moment.js

import { addFlashMessages } from '../utils.js';
import { notifyServer } from '../websocket.js';

moment.locale('fr');

export function refreshCalendar() {
  getCalendarInstance().setOption('events', getEventsUrl());
  getCalendarInstance().refetchEvents();
}

export function goTo(date) {
  getCalendarInstance().gotoDate(date);
}

function getHeaderToolbarConfig() {
  if (window.innerWidth < 768) {
    // Configuration pour mobile
    return {
      left: 'customButton',
      center: 'title',
      right: 'mobileMenuButton'
    };
  } else {
    // Configuration pour desktop
    return {
      left: 'customButton prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    };
  }
}

export function getEventsUrl() {
  let selectedAgendaIds = Array.from(document.querySelectorAll('.agenda-checkbox:checked'))
    .map((checkbox) => checkbox.value)
    .join(',');

  const filter = document.getElementById('filterInput').value;
  const input = filter && filter.trim() !== '' ? `?filter=${filter}` : '';
  return `/api/events/${selectedAgendaIds}${input}`;
}

let calendarInstance = null;

// Fonction pour créer et initialiser le calendrier
export const initCalendar = () => {
  const calendarEl = document.getElementById('calendar');
  const slidingPanel = document.getElementById('sliding-panel');
  if (!calendarEl) {
    console.error('Element #calendar non trouvé');
    return null;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'fr',
    timeZone: 'UTC',
    noEventsContent: 'Aucun événement disponible',
    firstDay: 1,
    headerToolbar: getHeaderToolbarConfig(),
    editable: true,
    eventStartEditable: true,
    customButtons: {
      customButton: {
        text: '',
        click: () => {
          // Toggle the sliding panel
          if (slidingPanel.classList.contains('open')) {
            slidingPanel.classList.remove('open');
            calendarEl.style.marginLeft = '0';
          } else {
            slidingPanel.classList.add('open');
            calendarEl.style.marginLeft = '300px';
          }
          calendar.updateSize();
        }
      },
      mobileMenuButton: {
        text: 'Actions',
        click: () => {
          // Créez un menu contextuel pour afficher les actions
          const menu = document.getElementById('mobile-menu');
          menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
      }
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Liste'
    },
    events: getEventsUrl(),
    eventDataTransform: (eventData) => {
      return {
        ...eventData,
        color: eventData.color,
        allDay: eventData.allDay
      };
    },
    eventClick: (info) => {
      openEventDetailsModal(info.event);
    },
    eventDrop: (info) => {
      const startDate = moment(info.event.start).toISOString().substring(0, 16);
      let endDate;

      document.getElementById('eventTitle').value = info.event.title;
      document.getElementById('eventDetails').value = info.event.extendedProps.description;
      document.getElementById('eventAllDay').checked = info.event.allDay;
      document.getElementById('eventRecurrence').value = info.event.extendedProps.recurrence;
      document.getElementById('eventRecurrenceInterval').value = info.event.extendedProps.interval;
      document.getElementById('eventRecurrenceCustom').value = info.event.extendedProps.unit;
      const saveButton = document.getElementById('updateEvent');
      saveButton.dataset.eventId = info.event.extendedProps.eventId;
      saveButton.dataset.occurrenceId = info.event.extendedProps.occurrenceId;
      saveButton.dataset.oldRecurrence = info.event.extendedProps.recurrence;

      // Si on passe de allDay à non allDay, on ajuste la date de fin
      if (!info.event.allDay && info.oldEvent.allDay) {
        endDate = moment(info.event.start).add(1, 'hour').toISOString().substring(0, 16);
      } else if (info.event.allDay && !info.oldEvent.allDay) {
        endDate = moment(info.event.start).add(1, 'day').toISOString().substring(0, 16);
      } else {
        endDate = moment(info.event.end).toISOString().substring(0, 16);
      }

      saveEvent(startDate, endDate);
    },
    eventResize: (info) => {
      if (info.event.end !== info.oldEvent.end) {
        const startDate = moment(info.event.start).toISOString().substring(0, 16);
        const endDate = moment(info.event.end).toISOString().substring(0, 16);

        document.getElementById('eventTitle').value = info.event.title;
        document.getElementById('eventDetails').value = info.event.extendedProps.description;
        document.getElementById('eventAllDay').checked = info.event.allDay;
        document.getElementById('eventRecurrence').value = info.event.extendedProps.recurrence;
        const saveButton = document.getElementById('updateEvent');
        saveButton.dataset.eventId = info.event.extendedProps.eventId;
        saveButton.dataset.occurrenceId = info.event.extendedProps.occurrenceId;
        saveButton.dataset.oldRecurrence = info.event.extendedProps.recurrence;
        saveEvent(startDate, endDate);
      }
    },
    eventDidMount: function (info) {
      info.el.style.backgroundColor = info.event.backgroundColor;
      info.el.classList.remove('fc-list-event');
    },
    dateClick: function (info) {
      const modal = document.getElementById('modal');
      const name = document.getElementById('event-name');
      const startDate = document.getElementById('event-date');
      const endDate = document.getElementById('event-date-end');
      const allDay = document.getElementById('event-all-day');
      const agenda = document.getElementById('event-agenda');
      const description = document.getElementById('event-description');
      startDate.type = info.allDay ? 'date' : 'datetime-local';
      endDate.type = startDate.type;
      startDate.value = info.dateStr;
      endDate.value = info.dateStr;
      allDay.checked = info.allDay;
      agenda.value = agenda.options[0].value;
      name.value = '';
      description.value = '';

      const errorElement = document.getElementById('date-error');
      const errAgenda = document.getElementById('agenda-error');
      const errName = document.getElementById('name-error');
      errName.style.display = 'none';
      errorElement.style.display = 'none';
      errAgenda.style.display = 'none';

      if (!info.allDay) {
        startDate.value = moment(info.dateStr).toISOString().substring(0, 16);
        endDate.value = moment(info.dateStr).add(1, 'hour').toISOString().substring(0, 16);
      }

      modal.style.display = 'block';
    }
  });

  const monthlyView = document.getElementById('monthlyView');
  const weeklyView = document.getElementById('weeklyView');
  const dailyView = document.getElementById('dailyView');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Ajouter des écouteurs d'événements pour les boutons de navigation de la vue mobile
  monthlyView.addEventListener('click', () => calendar.changeView('dayGridMonth'));
  weeklyView.addEventListener('click', () => calendar.changeView('timeGridWeek'));
  dailyView.addEventListener('click', () => calendar.changeView('timeGridDay'));
  prevBtn.addEventListener('click', () => calendar.prev());
  nextBtn.addEventListener('click', () => calendar.next());

  calendarInstance = calendar;

  calendar.render();
  document.querySelector('.fc-customButton-button').innerHTML = '<i class=material-symbols-outlined>menu</i>';
  return calendar; // Retourner l'instance du calendrier pour l'utiliser ailleurs
};

// Fonction pour obtenir l'instance du calendrier
export const getCalendarInstance = () => {
  if (!calendarInstance) {
    console.warn("Le calendrier n'est pas encore initialisé.");
  }
  return calendarInstance;
};
// Fonction pour ouvrir la modale
export const openEventDetailsModal = (eventData) => {
  const modal = document.getElementById('eventDetailsModal');
  if (!modal) {
    return;
  }
  const closeModal = document.getElementById('closeModal');
  closeModal.addEventListener('click', () => {
    closeEventDetailsModal();
  });
  //Pour la suppression d'event
  const saveButton = document.getElementById('updateEvent');
  saveButton.dataset.eventId = eventData.extendedProps.eventId;
  saveButton.dataset.occurrenceId = eventData.extendedProps.occurrenceId;
  saveButton.dataset.eventRecurrence = eventData.extendedProps.recurrence;
  saveButton.dataset.applyToAllOccurrences = eventData.extendedProps.applyToAll;
  const title = document.getElementById('event-title');
  const date = document.getElementById('event-date-preview');
  const color = document.getElementById('event-color-preview');
  const description = document.getElementById('event-description-preview');
  const owner = document.getElementById('event-owner-preview');
  title.innerText = eventData.title;
  color.style.backgroundColor = eventData.backgroundColor;
  owner.innerText = eventData.extendedProps.owner;
  if (eventData.extendedProps.description && eventData.extendedProps.description.trim() !== '') {
    document.getElementById('event-description-to-hide').style.display = 'flex';
    description.innerText = eventData.extendedProps.description;
  } else {
    document.getElementById('event-description-to-hide').style.display = 'none';
  }
  if (eventData.allDay) {
    const startDate = new Date(eventData.start);
    const endDate = eventData.end === null ? startDate : new Date(eventData.end);

    if (startDate.getUTCDate() === endDate.getUTCDate()) {
      date.innerText = moment(startDate)
        .format('dddd, DD MMMM')
        .replace(/^\w/, (c) => c.toUpperCase());
    } else {
      date.innerText = `${moment(startDate).format('DD')} – ${moment(endDate).format('DD MMMM YYYY')}`;
    }
  } else {
    const startDate = moment(eventData.start).toISOString().substring(0, 16);
    const endDate = moment(eventData.end).toISOString().substring(0, 16);
    date.innerText = moment(startDate).format('dddd, DD MMMM - HH:mm') + ' à ' + moment(endDate).format('HH:mm');
  }
  const editModal = document.getElementById('editEvent');
  editModal.addEventListener('click', () => {
    modal.style.display = 'none';
    openModal(eventData);
  });
  if (!eventData.extendedProps.canEdit) {
    editModal.hidden = true;
    document.getElementById('deleteEventPreview').hidden = true;
  } else {
    editModal.hidden = false;
    document.getElementById('deleteEventPreview').removeAttribute('hidden');
  }
  modal.style.display = 'flex';
};

// Fonction pour ouvrir la modale
export const openModal = (eventData) => {
  const modal = document.getElementById('eventModal');
  if (!modal) {
    return;
  }
  const allDay = document.getElementById('eventAllDay');
  allDay.checked = eventData.allDay;
  const startDate = document.getElementById('startEventTime');
  const endDate = document.getElementById('endEventTime');
  endDate.type = allDay.checked ? 'date' : 'datetime-local';
  startDate.type = endDate.type;

  allDay.addEventListener('click', () => {
    if (allDay.checked) {
      const newStartDate = startDate.value.split('T')[0];
      startDate.type = 'date';
      endDate.type = 'date';
      startDate.value = newStartDate;
      endDate.value = startDate.value;
    } else {
      const newStartDate = startDate.value + 'T07:00';
      const newEndDate = startDate.value + 'T08:00';
      startDate.type = 'datetime-local';
      endDate.type = 'datetime-local';
      startDate.value = newStartDate;
      endDate.value = newEndDate;
    }
  });
  document.getElementById('eventTitle').value = eventData.title;
  document.getElementById('eventDetails').value = eventData.extendedProps.description || 'Pas de détails disponibles.';
  allDay.checked = false;
  if (eventData.allDay) {
    allDay.click();
    const startDateValue = moment(eventData.start).format('YYYY-MM-DD');

    // Calculer end uniquement si eventData.end est défini
    let endDateValue = eventData.end ? moment(eventData.end).add(-1, 'd').format('YYYY-MM-DD') : startDateValue;
    startDate.value = startDateValue;
    endDate.value = endDateValue;
  } else {
    startDate.value = moment(eventData.start).toISOString().substring(0, 16);
    endDate.value = moment(eventData.end).toISOString().substring(0, 16);
  }

  // Définit la récurrence de l'event
  let recurrenceSelect = document.getElementById('eventRecurrence');
  const showRecPanel = document.getElementById('showRecurrenceOptionsEdit');
  const recurrenceCustomSelect = document.getElementById('eventRecurrenceCustom');
  const recurrenceCustomInterval = document.getElementById('eventRecurrenceInterval');

  recurrenceCustomInterval.addEventListener('input', () => {
    if (recurrenceCustomInterval.value === '' || recurrenceCustomInterval.value === '0') {
      recurrenceCustomInterval.value = 1;
    }
  });
  let recurrence = eventData.extendedProps.recurrence ?? 5; // Si l'événement n'a pas de récurrence, il s'agit d'une récurrence personnalisée

  let unit = eventData.extendedProps.unit ?? recurrence;
  if (unit === 4) {
    unit = 0;
  }
  let interval = eventData.extendedProps.interval ?? 1;
  recurrenceCustomSelect.value = unit;
  recurrenceCustomInterval.value = interval;

  // Custom de la récurrence
  if (showRecPanel && recurrence !== 5) {
    showRecPanel.style.display = 'none';
  } else {
    showRecPanel.style.display = 'flex';
  }

  if (recurrenceSelect) {
    recurrenceSelect.addEventListener('change', () => {
      if (parseInt(recurrenceSelect.value) === 5) {
        showRecPanel.style.display = 'flex';

        recurrenceCustomSelect.addEventListener('change', () => {
          handleCustomRecurrence();
        });

        recurrenceCustomInterval.addEventListener('input', () => {
          handleCustomRecurrence();
        });
      } else {
        showRecPanel.style.display = 'none';
      }
    });
  }

  function handleCustomRecurrence() {
    const unit = parseInt(recurrenceCustomSelect.value);
    const interval = recurrenceCustomInterval.value;

    if (!isNaN(unit) && !isNaN(interval) && interval > 0) {
      return [unit, interval];
    } else {
      console.warn('Les champs de récurrence personnalisée doivent être des nombres entiers positifs.');
    }
  }

  recurrenceSelect.value = recurrence;

  const optionApplyToAll = document.getElementById('optionApplyToAll');
  if (recurrence !== 4) {
    optionApplyToAll.style.display = 'flex';
  } else {
    optionApplyToAll.style.display = 'none';
  }

  const saveButton = document.getElementById('updateEvent');
  saveButton.dataset.eventId = eventData.extendedProps.eventId;
  saveButton.dataset.occurrenceId = eventData.extendedProps.occurrenceId;
  saveButton.dataset.oldRecurrence = eventData.extendedProps.recurrence;

  modal.style.display = 'block';
};

// Fonction pour fermer la modale d'édition
export const closeModal = () => {
  const modal = document.getElementById('eventModal');
  modal.style.display = 'none';
  refreshCalendar();
};
// Fonction pour fermer la modale des détails
export const closeEventDetailsModal = () => {
  const modal = document.getElementById('eventDetailsModal');
  modal.style.display = 'none';
};

// Fonction pour gérer la fermeture du menu contextuel
export const handleOutsideClick = (event) => {
  const modal = document.getElementById('eventModal');
  const modalDetails = document.getElementById('eventDetailsModal');
  if (event.target === modal) {
    closeModal();
    refreshCalendar();
  }
  if (event.target === modalDetails) {
    closeEventDetailsModal();
  }
};

export const saveEvent = (startDate, endDate) => {
  const saveButton = document.getElementById('updateEvent');
  const errorMessages = document.getElementById('error-update-event');
  let eventId = saveButton.dataset.eventId;
  let sentId = eventId;

  const stringAppend = document.getElementById('eventAllDay').checked ? '' : '+00:00';
  const applyToAll = document.getElementById('applyToAllOccurrences').checked;
  const oldRecurrence = Number(saveButton.dataset.oldRecurrence);

  const updatedData = {
    title: document.getElementById('eventTitle').value.trim(),
    description: document.getElementById('eventDetails').value.trim(),
    start: startDate + stringAppend,
    end: endDate + stringAppend,
    allDay: document.getElementById('eventAllDay').checked,
    recurrence: document.getElementById('eventRecurrence').value,
    occurrence: 0, // Par défaut, c'est un événement principal
    applyToAll: applyToAll,
    sentId: sentId,
    oldRecurrence: oldRecurrence
  };

  // Vérifie si une récurrence personnalisée est activée
  let rec = Number(updatedData.recurrence);
  if (rec === 5) {
    const unit = document.getElementById('eventRecurrenceCustom').value;
    const interval = document.getElementById('eventRecurrenceInterval').value;

    if (oldRecurrence !== 4) {
      eventId = saveButton.dataset.occurrenceId;
      updatedData.sentId = eventId;
    }
    updatedData.unit = parseInt(unit, 10);
    updatedData.interval = parseInt(interval, 10);
    updatedData.occurrence = 1; // Marque comme une occurrence

    if (
      isNaN(updatedData.unit) ||
      isNaN(updatedData.interval) ||
      updatedData.interval < 1 ||
      updatedData.interval > 30
    ) {
      errorMessages.innerText = 'Les champs doivent être des nombres entiers positifs.';
      return;
    }
  } else if (rec === 0 || rec === 1 || rec === 2 || rec === 3) {
    if (oldRecurrence !== 4) {
      eventId = saveButton.dataset.occurrenceId;
      updatedData.sentId = eventId;
    }
    updatedData.occurrence = 1; // Marque comme une occurrence
    updatedData.unit = rec;
    updatedData.interval = 1;
  }

  if (!updatedData.title) {
    errorMessages.innerText = 'Le champ titre est obligatoire.';
    return;
  }
  if (!updatedData.start || !updatedData.end) {
    errorMessages.innerText = 'Les champs dates sont obligatoires.';
    return;
  }

  // Vérifie si la date de fin est supérieure à la date de début
  if (
    (new Date(updatedData.start) >= new Date(updatedData.end) && !updatedData.allDay) ||
    (new Date(updatedData.start) > new Date(updatedData.end) && updatedData.allDay)
  ) {
    errorMessages.innerText = 'La date de fin doit être supérieure à la date de début.';
    return;
  }

  fetch(`/api/events/update/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        addFlashMessages(['Événement mis à jour avec succès']);
        notifyServer({ type: 'update', message: 'Event updating' });
        refreshCalendar();
        closeModal();
      } else {
        addFlashMessages([data.message]);
        refreshCalendar();
        errorMessages.innerText = data.message || "Échec de la mise à jour de l'événement.";
      }
    })
    .catch((error) => {
      console.error('Erreur:', error);
      errorMessages.innerText = 'Une erreur est survenue lors de la mise à jour.';
    });
};

// Fonction pour supprimer un événement
export const deleteEvent = () => {
  const saveButton = document.getElementById('updateEvent');
  let eventId = saveButton.dataset.eventId;
  let recurrence = saveButton.dataset.eventRecurrence || document.getElementById('eventRecurrence').value;
  let applyToAll = document.getElementById('applyToAllOccurrences').checked;

  const deleteNature = {
    recurrence: recurrence,
    applyToAll: applyToAll
  };

  if (Number(recurrence) !== 4) {
    eventId = saveButton.dataset.occurrenceId;
  }

  closeModal();
  fetch(`/api/events/delete/${eventId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deleteNature)
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeEventDetailsModal();
        notifyServer({ type: 'update', message: 'Event deletion' });
        refreshCalendar();
        addFlashMessages(['Événement supprimé avec succès']);
      } else {
        alert("Échec de la suppression de l'événement.");
      }
    })
    .catch((error) => console.error('Erreur:', error));
};
