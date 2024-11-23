const shareOrExport = document.getElementById("shareOrExport");

const agendaItems = document.getElementById("agenda-list").children;
for (let i = 0; i < agendaItems.length; i++) {
  const agendaItem = agendaItems[i];
  const agendaShareButton = agendaItem.querySelector("button");
  const agendaItemValue = agendaShareButton.value;
  const agendaItemName = agendaItem.querySelector("a").dataset.agendaName;
  agendaShareButton.addEventListener("click", () => {
    toggleMenuShareOrExport(agendaItemValue, agendaItemName);
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
function toggleMenuShareOrExport(val, name) {
  shareOrExport.style.display = "flex";
  shareOrExport.value = val;
  document.getElementById("agendaName").textContent = name;
}
