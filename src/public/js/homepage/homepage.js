document.addEventListener("DOMContentLoaded", () => {
  const previewPanel = document.getElementById("homepageDailyPreview");

  // si on est bien connecté et qu'il y a une preview
  if (previewPanel) {
    fetch("/api/homepage/todayEvents", { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          data.forEach((event) => {
            if (event.allDay) {
              previewPanel.innerHTML += `<div><span class="fw-bold">${event.title}</span> toute la journée<br/></div>`;
            } else {
              let dateStart = new Date(event.start);
              let start = dateStart.toLocaleString("fr-FR", { timeZone: "UTC" });
              let dateEnd = new Date(event.end);
              let end = dateEnd.toLocaleString("fr-FR", { timeZone: "UTC" });
              previewPanel.innerHTML += `<div><span class="fw-bold">${event.title}</span> du ${start} au ${end}<br/></div>`;
            }
          });
        } else {
          previewPanel.innerHTML = "<div>Vous n'avez aucun événement aujourd'hui.<br/></div>";
        }
      });
  }
});
