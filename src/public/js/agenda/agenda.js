import { initCalendar, saveEvent, deleteEvent, closeModal, handleOutsideClick } from "./calendar.js";

document.addEventListener("DOMContentLoaded", () => {
  const closeButton = document.querySelector(".close");
  const saveButton = document.getElementById("updateEvent");
  const deleteButton = document.getElementById("deleteEvent");

  // Initialisation du calendrier
  const calendar = initCalendar(agenda);

  // Si le calendrier est bien initialisé
  if (calendar) {
    closeButton.onclick = closeModal;
    window.onclick = handleOutsideClick;

    saveButton.onclick = () => saveEvent(calendar);
    deleteButton.onclick = () => deleteEvent(calendar);

    // Rendre le calendrier responsive lors du redimensionnement
    window.addEventListener("resize", () => {
      calendar.updateSize();
    });
  }
});
