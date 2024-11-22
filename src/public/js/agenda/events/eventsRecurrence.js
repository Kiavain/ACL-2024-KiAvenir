document.addEventListener("DOMContentLoaded", () => {
  // Sélection des éléments
  const recurrenceSelect = document.getElementById("event-recurrence");
  const showRecurrencePanel = document.getElementById("show-recurrence-options");
  const recurrenceCustomSelect = document.getElementById("event-recurrence-custom");
  const recurrenceCustomNumber = document.getElementById("event-recurrence-number");

  const recurrenceSelectEdit = document.getElementById("eventRecurrence");
  const showRecurrencePanelEdit = document.getElementById("showRecurrenceOptions");
  const recurrenceCustomSelectEdit = document.getElementById("eventRecurrenceCustom");
  const recurrenceCustomNumberEdit = document.getElementById("eventRecurrenceNumber");

  // Masquer les options personnalisées au chargement
  if (showRecurrencePanel) {
    showRecurrencePanel.style.display = "none";
  }
  if (showRecurrencePanelEdit) {
    showRecurrencePanelEdit.style.display = "none";
  }

  // Fonction pour afficher ou masquer les options personnalisées
  function toggleCustomOptions(selectElement, panelElement) {
    if (selectElement.value === "5") {
      panelElement.style.display = "flex";
    } else {
      panelElement.style.display = "none";
    }
  }

  // Gérer les changements dans le menu de récurrence principal
  if (recurrenceSelect) {
    recurrenceSelect.addEventListener("change", () => {
      toggleCustomOptions(recurrenceSelect, showRecurrencePanel);
    });
  }

  if (recurrenceSelectEdit) {
    recurrenceSelectEdit.addEventListener("change", () => {
      toggleCustomOptions(recurrenceSelectEdit, showRecurrencePanelEdit);
    });
  }

  // Gérer les changements dans les options personnalisées
  if (recurrenceCustomSelect) {
    recurrenceCustomSelect.addEventListener("change", (event) => {
      const customUnit = event.target.value; // Valeur sélectionnée (jours, semaines, etc.)
      handleCustomRecurrenceChange(customUnit, recurrenceCustomNumber.value);
    });
  }

  if (recurrenceCustomNumber) {
    recurrenceCustomNumber.addEventListener("input", (event) => {
      const customNumber = event.target.value;
      handleCustomRecurrenceChange(recurrenceCustomSelect.value, customNumber);
    });
  }

  // Gérer les changements dans les options personnalisées (édition)
  function handleCustomRecurrenceChange(unit) {
    return null;
  }
});
