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
    toggleMenuShareOrExport(agendaItemValue, agendaItemName, agendaItemColor, agendaItemDescription, agendaShareButton);
  });
}
//On regarde si il y'a des agendas partagés
const shareAgendaList = document.getElementById("share-agenda-list");
if (shareAgendaList && shareAgendaList.children.length > 0) {
  //On applique alors la logique pour le bouton de désabonnement
  const sharedAgendaItems = shareAgendaList.children;
  for (let i = 0; i < sharedAgendaItems.length; i++) {
    const sharedAgendaItem = sharedAgendaItems[i];
    const sharedAgendaItemButton = sharedAgendaItem.querySelector("button");
    const guestId = sharedAgendaItemButton.value;
    sharedAgendaItemButton.addEventListener("click", () => {
      if (confirm("Êtes-vous sûr de vous désabonner de cet agenda ?")) {
        console.log("Désabonnement de l'agenda");
        const updatedData = {
          guestId: guestId,
          desabonnement: true
        };
        // Mise à jour de la BDD
        fetch("/api/agenda/removeGuest", {
          method: "DELETE",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(updatedData)
        })
          .then((response) => {
            if (response.ok) {
              window.location.reload();
            }
          })
          .catch((error) => console.error("Erreur:", error));
      }
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target !== shareOrExport) {
      shareOrExport.style.display = "none";
    }
  });
});
function toggleMenuShareOrExport(val, name, color, description, button) {
  //Si on clique sur le même agenda on ferme la pop up
  if (shareOrExport.style.display === "grid" && shareOrExport.value === val) {
    shareOrExport.style.display = "none";
    return;
  }
  shareOrExport.style.display = "grid";
  shareOrExport.value = val;
  document.getElementById("new-agenda-name").value = name;
  document.getElementById("new-agenda-color").value = color;
  document.getElementById("new-agenda-description").textContent = description;
  document.getElementById("agendaName").textContent = name;
  // Positionnement dynamique
  const buttonRect = button.getBoundingClientRect();
  const containerRect = document.getElementById("calendar-container").getBoundingClientRect();
  shareOrExport.style.position = "absolute";
  shareOrExport.style.top = `${buttonRect.bottom - containerRect.top + window.scrollY + 5}px`;
}
