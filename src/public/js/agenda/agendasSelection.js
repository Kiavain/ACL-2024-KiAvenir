document.addEventListener("DOMContentLoaded", function () {
  // Fonction pour mettre à jour la route avec les IDs des agendas sélectionnés
  function updateURL() {
    const selectedAgendaIds = Array.from(document.querySelectorAll(".agenda-checkbox:checked")).map(
      (checkbox) => checkbox.value
    );
    const newUrl = selectedAgendaIds.length > 0 ? `/agenda/${selectedAgendaIds.join(",")}` : "/agenda";

    // Modifie l'URL et recharge la page
    window.history.pushState(null, "", newUrl);
    window.location.reload();
  }

  // Mise à jour automatique de l'URL => cocher/décocher une case
  document.querySelectorAll(".agenda-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", updateURL);
  });

  // Coche les cases par défaut si leurs IDs sont dans l'URL
  const urlParams = window.location.pathname.split("/")[2];
  if (urlParams) {
    const agendaIds = urlParams.split(",");
    document.querySelectorAll(".agenda-checkbox").forEach((checkbox) => {
      if (agendaIds.includes(checkbox.value)) {
        checkbox.checked = true;
      }
    });
  }
});
