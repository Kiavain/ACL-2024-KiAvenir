const recurrenceSelect = document.getElementById("event-recurrence");
const recurrenceCustom = document.getElementById("showRecurrenceOptions");

const recurenceSelectEdit = document.getElementById("eventRecurrence");
const recurrenceCustomEdit = document.getElementById("showRecurrenceOptionsEdit");

if (recurrenceSelect) {
  recurrenceSelect.addEventListener("change", (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === "5") {
      // Afficher les options personnalisées
      recurrenceCustom.style.display = "flex";
    } else {
      // Cacher les options personnalisées
      recurrenceCustom.style.display = "none";
    }
  });
}

if (recurenceSelectEdit) {
  recurenceSelectEdit.addEventListener("change", (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === "5") {
      // Afficher les options personnalisées
      recurrenceCustomEdit.style.display = "flex";
    } else {
      // Cacher les options personnalisées
      recurrenceCustomEdit.style.display = "none";
    }
  });
}
