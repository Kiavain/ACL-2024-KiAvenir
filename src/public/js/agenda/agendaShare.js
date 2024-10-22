const shareAgendaButton = document.getElementById("shareAgenda");
const shareAgendaConfirmButton = document.getElementById("shareAgendaConfirm");
const shareAgendaCloseButton = document.getElementById("shareAgenda-close-btn");
const modal = document.getElementById("shareAgendaModal");

shareAgendaCloseButton.onclick = function () {
  modal.style.display = "none";
};

shareAgendaButton.addEventListener("click", () => {
  shareAgenda();
});

shareAgendaConfirmButton.addEventListener("click", () => {
  submitShareAgenda();
});

function shareAgenda() {
  const sharedAgendaId = document.getElementById("shareOrExport").value;
  console.log("Id de l'agenda à partager : " + sharedAgendaId);
  modal.style.display = "block";
  const currentUrl = window.location.href;
  const newUrl = `${currentUrl}/${sharedAgendaId}`;
  // Appel vers la nouvelle route
  fetch(newUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log("Données de l'agenda partagé :", data);
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération de l'agenda partagé :", error);
    });
}

function submitShareAgenda() {
  const agendaId = document.getElementById("shareOrExport").value;
  const mail = document.getElementById("email-share").value;
  const role = document.getElementById("role-share-agenda").value;
  const mailError = document.getElementById("mail-error");
  const roleError = document.getElementById("role-error");
  const otherError = document.getElementById("other-error");
  let isMailError = false;
  let isRoleError = false;
  let isOtherError = false;

  const data = {
    mail: mail,
    role: role
  };
  fetch(`/api/agenda/${agendaId}/shareAgenda`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => {
      //Vérifie la réponse d'erreur
      if (response.status === 400) {
        isMailError = true;
      } else if (response.status === 401) {
        isRoleError = true;
      } else if (response.status === 404) {
        isOtherError = true;
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        roleError.style.display = "none";
        mailError.style.display = "none";
        otherError.style.display = "none";
        window.location.reload();
      } else {
        if (isMailError) {
          mailError.textContent = data.message;
          mailError.style.display = "block";
        } else if (isRoleError) {
          roleError.style.display = "block";
        } else if (isOtherError) {
          otherError.style.display = "block";
        }
        console.log("Erreur partage d'agenda : " + data.message);
      }
    })
    .catch((error) => console.error("Erreur:", error));
}

document.querySelectorAll(".role-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    const dropdown = event.target.closest(".guest-item").querySelector(".role-dropdown");

    // Toggle la visibilité de la div dropdown
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
      dropdown.style.display = "block";
    } else {
      dropdown.style.display = "none";
    }

    // Fermer la dropdown si on clique ailleurs
    document.addEventListener("click", function handleClickOutside(event) {
      if (!button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
        document.removeEventListener("click", handleClickOutside);
      }
    });
  });
});

// Gérer le changement de rôle
document.querySelectorAll(".role-dropdown li").forEach((li) => {
  li.addEventListener("click", (event) => {
    const selectedRole = event.target.getAttribute("data-role");
    const guestItem = event.target.closest(".guest-item");

    // Met à jour le texte du rôle dans le bouton
    const roleText = guestItem.querySelector(".role-text");
    roleText.textContent = selectedRole;

    // Met à jour les icônes de check
    const dropdown = guestItem.querySelector(".role-dropdown");
    dropdown.querySelectorAll(".check-icon").forEach((icon) => {
      icon.style.visibility = "hidden";
    });
    event.target.querySelector(".check-icon").style.visibility = "visible";
    const guestId = guestItem.dataset.guestId;
    const role = roleText.textContent;
    const updatedData = {
      guestId: guestId,
      role: role
    };
    // Fermer le dropdown après sélection
    dropdown.style.display = "none";
    // Mise à jour de la BDD
    fetch("/api/agenda/updateGuest", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    })
      .then((response) => response.json())
      .catch((error) => console.error("Erreur:", error));
  });
});
