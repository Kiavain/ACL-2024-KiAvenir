import { getCalendarInstance, getEventsUrl, goTo } from '../calendar.js';

document.getElementById('filterInput').addEventListener('input', function () {
  getCalendarInstance().setOption('events', getEventsUrl());
});

document.getElementById('eventSearch').addEventListener('input', async (e) => {
  const searchTerm = e.target.value;
  const searchResults = document.getElementById('searchResults');
  const eventList = document.getElementById('eventList');
  const noResultsMessage = document.getElementById('noResultsMessage');

  if (searchTerm.trim() === '') {
    searchResults.style.display = 'none';
    return;
  }
  searchResults.style.display = 'block';

  let selectedAgendaIds = Array.from(document.querySelectorAll('.agenda-checkbox:checked'))
    .map((checkbox) => checkbox.value)
    .join(',');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // Exemple pour 1 an dans le futur

  const startParam = encodeURIComponent(startDate.toISOString());
  const endParam = encodeURIComponent(endDate.toISOString());

  const API_URL = `/api/events/${selectedAgendaIds}?start=${startParam}&end=${endParam}&filter=${searchTerm}&timeZone=UTC `;

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    if (response.ok) {
      eventList.innerHTML = ''; // Réinitialise la liste des événements
      data.slice(0, 5).forEach((event) => {
        const li = document.createElement('li');
        let eventTitle = event.title.length > 10 ? event.title.substring(0, 7) + '...' : event.title;
        li.innerHTML = `
          <div class="event-color" style="background-color: ${event.color};"></div>
          <div class="event-title">${eventTitle}</div>
          <div class="event-agenda">${moment(event.start).format('DD/MM/YYYY')}</div>
        `;

        li.addEventListener('click', () => {
          goTo(new Date(event.start));
          searchResults.style.display = 'none';
        });

        eventList.appendChild(li);
      });

      searchResults.style.display = 'block';
      noResultsMessage.style.display = data.length === 0 ? 'block' : 'none';
    } else {
      searchResults.style.display = 'block';
      noResultsMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Erreur lors de la recherche des événements :', error);
    searchResults.style.display = 'block';
    noResultsMessage.style.display = 'block';
  }
});
