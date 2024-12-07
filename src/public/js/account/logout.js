import { closeWebSocket } from '../websocket.js';

function sendLogout() {
  fetch('/api/account/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then((response) => {
      if (response.ok) {
        closeWebSocket();
        localStorage.removeItem('selectedAgendaIds');
        window.location.href = '/';
      } else {
        console.error('Erreur lors de la déconnexion');
      }
    })
    .catch((error) => console.error('Erreur:', error));
}

// Attacher l'événement au bouton menu
document.getElementById('logout_link').addEventListener('click', sendLogout);
