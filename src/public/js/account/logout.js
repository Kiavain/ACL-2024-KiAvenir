function sendLogout() {
  document.getElementById('logoutForm').submit();
}

// Attacher l'événement au bouton menu
document.getElementById('logout_link').addEventListener('click', sendLogout);
