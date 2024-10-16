function toggleMenu() {
  const dropdownMenu = document.getElementById("dropdown-menu");
  const isVisible = dropdownMenu.style.display === "block";

  dropdownMenu.style.display = isVisible ? "none" : "block";
}

// Ferme le menu lorsque l'utilisateur clique en dehors de celui-ci
document.addEventListener("click", function (event) {
  const dropdownMenu = document.getElementById("dropdown-menu");
  const menuButton = document.getElementById("menu-button");

  if (
    !dropdownMenu.contains(event.target) &&
    !menuButton.contains(event.target)
  ) {
    dropdownMenu.style.display = "none";
  }
});
