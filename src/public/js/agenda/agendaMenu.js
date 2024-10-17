// Fonction pour afficher/masquer le menu
function toggleMenu() {
  const dropdownMenu = document.getElementById("dropdown-menu");
  const isVisible = dropdownMenu.style.display === "block";
  dropdownMenu.style.display = isVisible ? "none" : "block";
}
const shareOrExport = document.getElementById("shareOrExport");
// Attacher l'événement au bouton menu
document.getElementById("menu-button").addEventListener("click", toggleMenu);

// Fermer le menu lorsque l'utilisateur clique en dehors
document.addEventListener("click", function (event) {
  const dropdownMenu = document.getElementById("dropdown-menu");
  const menuButton = document.getElementById("menu-button");

  if (!dropdownMenu.contains(event.target) && !menuButton.contains(event.target)) {
    dropdownMenu.style.display = "none";
  }
  if (!shareOrExport.contains(event.target) && !dropdownMenu.contains(event.target)) {
    shareOrExport.style.display = "none";
  }
});
const agendaItems = document.getElementById("agenda-list").children;
for (let i = 0; i < agendaItems.length; i++) {
  const agendaItem = agendaItems[i];
  const agendaItemValue = agendaItem.querySelector("button").value;
  const agendaItemName = agendaItem.querySelector("a").textContent;
  console.log(agendaItemName);
  agendaItem.addEventListener("click", () => {
    toggleMenuShareOrExport(agendaItemValue, agendaItemName);
  });
}
function toggleMenuShareOrExport(val, name) {
  console.log("toggleMenuShareOrExport");
  shareOrExport.style.display = "flex";
  toggleMenu();
  shareOrExport.value = val;
  console.log(shareOrExport.value);
  document.getElementById("agendaName").textContent = name;
}
