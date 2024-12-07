import { refreshCalendar } from './agenda/calendar.js';
import { refreshNotifications } from './notifications/notifications.js';

let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 3000; // Intervalle entre les tentatives (en ms)

// Connexion au serveur WebSocket
function connectWebSocket() {
  socket = new WebSocket('ws://localhost:8080');

  socket.onopen = () => {
    console.log('Connecté au serveur WebSocket.');
    reconnectAttempts = 0; // Réinitialiser les tentatives après une connexion réussie
  };

  // Réception des mises à jour du serveur
  socket.onmessage = async (event) => {
    let data = event.data;
    if (data instanceof Blob) {
      data = await data.text();
      data = JSON.parse(data);
    }

    if (data.type === 'update') {
      refreshCalendar();
      refreshNotifications();
    }
  };

  // Gestion des erreurs
  socket.onerror = (error) => {
    console.error('Erreur WebSocket :', error);
  };

  // Détection de fermeture et tentative de reconnexion
  socket.onclose = () => {
    console.warn('Connexion WebSocket fermée.');
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(
        `Tentative de reconnexion (${reconnectAttempts}/${maxReconnectAttempts}) dans ${reconnectInterval / 1000} secondes...`
      );
      setTimeout(connectWebSocket, reconnectInterval);
    } else {
      console.error('Nombre maximum de tentatives de reconnexion atteint.');
    }
  };
}

// Envoyer une mise à jour au serveur
export function notifyServer(update) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(update));
  } else {
    console.error('WebSocket non connecté.');
  }
}

// Fermer la connexion WebSocket
export function closeWebSocket() {
  socket.close();
}

// Initialisation du WebSocket
connectWebSocket();
