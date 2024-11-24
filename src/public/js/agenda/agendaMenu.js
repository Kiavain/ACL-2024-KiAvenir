const shareOrExport = document.getElementById("shareOrExport");

const agendaItems = document.getElementById("agenda-list").children;
for (let i = 0; i < agendaItems.length; i++) {
  const agendaItem = agendaItems[i];
  const agendaShareButton = agendaItem.querySelector("button");
  const agendaItemValue = agendaShareButton.value;
  const agendaItemName = agendaItem.querySelector("a").dataset.agendaName;
  const agendaItemColor = agendaItem.querySelector("a").dataset.agendaColor;
  const agendaItemDescription = agendaItem.querySelector("a").dataset.agendaDescription;
  agendaShareButton.addEventListener("click", () => {
    toggleMenuShareOrExport(agendaItemValue, agendaItemName, agendaItemColor, agendaItemDescription);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target !== shareOrExport) {
      shareOrExport.style.display = "none";
    }
  });
});
function toggleMenuShareOrExport(val, name, color, description) {
  shareOrExport.style.display = "flex";
  shareOrExport.value = val;
  document.getElementById("new-agenda-name").value = name;
  document.getElementById("new-agenda-color").value = color;
  document.getElementById("new-agenda-description").textContent = description;
  document.getElementById("agendaName").textContent = name;
}
