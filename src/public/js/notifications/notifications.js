import { notifyServer } from '../websocket.js';
import { addFlashMessages } from '../utils.js';

document.addEventListener('DOMContentLoaded', function () {
  refreshNotifications();
});

export function refreshNotifications() {
  const notifCounter = document.getElementById('notification-count');
  if (!notifCounter) {
    return;
  }

  fetch('/api/notifications')
    .then((response) => response.json())
    .then((data) => {
      notifCounter.innerHTML = data.length;

      if (data.length > 0) {
        notifCounter.style.display = 'block';
        displayNotifications(data);
      } else {
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = '<li class="dropdown-item">Aucune notification</li>';
      }
    });
}

// Fonction pour créer une notification
function createNotificationItem(userId, notification) {
  const li = document.createElement('li');
  li.classList.add('dropdown-item', 'd-flex', 'align-items-center', 'justify-content-between', 'notification-item');

  // Notification texte tronqué
  const span = document.createElement('span');
  span.classList.add('notification-text', 'text-truncate');
  span.title = notification.message;
  span.textContent = notification.message;

  // Conteneur des boutons
  const buttonContainer = document.createElement('div');

  // Bouton de validation
  const validateButton = document.createElement('button');
  validateButton.classList.add('btn', 'btn-sm', 'btn-success', 'mx-1');
  validateButton.title = 'Valider';
  validateButton.innerHTML = '<span class="material-symbols-outlined">check_circle</span>';
  validateButton.addEventListener('click', () => {
    fetch(`/api/agenda/${notification.id}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          notifyServer('refreshNotifications');
          window.location.href = '/agenda';
        } else {
          addFlashMessages(["Erreur lors de l'acceptation de l'invitation."]);
        }
      })
      .catch((error) => console.error('Erreur:', error));
  });

  // Bouton de refus
  const refuseButton = document.createElement('button');
  refuseButton.classList.add('btn', 'btn-sm', 'btn-danger', 'mx-1');
  refuseButton.title = 'Refuser';
  refuseButton.innerHTML = '<span class="material-symbols-outlined">cancel</span>';
  refuseButton.addEventListener('click', () => {
    const updatedData = {
      guestId: userId,
      desabonnement: true
    };

    // Mise à jour de la BDD
    fetch('/api/agenda/removeGuest', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    })
      .then((response) => {
        if (response.ok) {
          addFlashMessages(['Invitation refusée.']);
          refreshNotifications();
        }
      })
      .catch((error) => console.error('Erreur:', error));
  });

  // Ajout des boutons dans le conteneur
  buttonContainer.appendChild(validateButton);
  buttonContainer.appendChild(refuseButton);

  // Ajout du texte et des boutons dans l'élément de notification
  li.appendChild(span);
  li.appendChild(buttonContainer);

  return li;
}

// Fonction pour afficher les notifications
function displayNotifications(notifications) {
  const notificationList = document.getElementById('notification-list');
  const notificationCount = document.getElementById('notification-count');

  const userId = notificationList.dataset.userId;

  // Nettoie les notifications existantes
  notificationList.innerHTML = '';

  // Met à jour le badge
  notificationCount.textContent = notifications.length;

  // Ajoute chaque notification
  notifications.forEach((notification) => {
    const notificationItem = createNotificationItem(userId, notification);
    notificationList.appendChild(notificationItem);
  });
}
