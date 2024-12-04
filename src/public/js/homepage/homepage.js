document.addEventListener("DOMContentLoaded", () => {
  const previewPanel = document.getElementById("homepageDailyPreview");

  // si on est bien connecté et qu'il y a une preview
  if (previewPanel) {
    fetch("/api/homepage/todayEvents", { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        data.forEach((event) => {
          previewPanel.textContent += event.title;
        });
      });
  }
});
