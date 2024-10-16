// Fonction pour afficher/masquer le menu
function toggleMenu() {
  const dropdownMenu = document.getElementById("dropdown-menu");
  const isVisible = dropdownMenu.style.display === "block";
  dropdownMenu.style.display = isVisible ? "none" : "block";
}

// Attacher l'événement au bouton menu
document.getElementById("menu-button").addEventListener("click", toggleMenu);

// Fermer le menu lorsque l'utilisateur clique en dehors
document.addEventListener("click", function (event) {
  const dropdownMenu = document.getElementById("dropdown-menu");
  const menuButton = document.getElementById("menu-button");

  if (!dropdownMenu.contains(event.target) && !menuButton.contains(event.target)) {
    dropdownMenu.style.display = "none";
  }
});
