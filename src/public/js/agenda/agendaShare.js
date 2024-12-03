import { addFlashMessages } from "../utils.js";

const shareAgendaButton = document.getElementById("shareAgenda");
const shareAgendaConfirmButton = document.getElementById("shareAgendaConfirm");
const shareAgendaCloseButton = document.getElementById("shareAgenda-close-btn");
const modal = document.getElementById("shareAgendaModal");

// Vérifie si le document est chargé
document.addEventListener("DOMContentLoaded", () => {
  shareAgendaCloseButton.onclick = () => (modal.style.display = "none");
  shareAgendaButton.onclick = () => shareAgenda();
  shareAgendaConfirmButton.onclick = () => submitShareAgenda();

  // Fermer la modale si on clique ailleurs (et enlève l'écouteur)
  window.addEventListener("click", function handleClickOutside(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

/**
 * Affiche la modale de partage d'agenda
 */
function shareAgenda() {
  const sharedAgendaId = document.getElementById("shareOrExport").value;

  // Faire une requête AJAX pour récupérer les invités associés à cet agenda
  fetch(`/getGuests?agendaId=${sharedAgendaId}`)
    .then((response) => response.json())
    .then((guests) => {
      const guestList = document.getElementById("access-shared-users");
      guestList.innerHTML = "<li>Vous : Propriétaire</li>"; // Remettre "Propriétaire" et vider le reste

      // Ajouter les invités filtrés
      guests.forEach((guest) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <div class="guest-item" data-guest-id="${guest.id}">
              <span class="username">${guest.username}</span>
              <div>
                <button class="icon-button role-button">
                  <div style="display: inline-flex;">
                    <span class="role-text">${guest.role}</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" focusable="false" class="Q6yead QJZfhe mig17c">
                      <path d="M7 10l5 5 5-5H7z"></path>
                    </svg>
                  </div>
                </button>

                <!-- Div cachée avec la liste des rôles -->
                <div class="role-dropdown" style="display: none; position: absolute;">
                  <p style="font-weight: bold;">Rôle</p>
                  <ul>
                    <li data-role="Lecteur">
                      <span class="material-symbols-outlined check-icon" style="visibility: ${guest.role === "Lecteur" ? "visible" : "hidden"};">
                        check
                      </span> Lecteur
                    </li>
                    <li data-role="Editeur">
                      <span class="material-symbols-outlined check-icon" style="visibility: ${guest.role === "Editeur" ? "visible" : "hidden"};">
                        check
                      </span> Editeur
                    </li>
                  </ul>
                </div>

              </div>
              <button class="icon-button remove-guest-button">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          `;
        guestList.appendChild(listItem);
      });
      applyRoleDropdownListeners();
    })
    .catch((err) => console.error("Erreur lors du chargement des invités:", err));

  // Afficher la modale
  modal.style.display = "block";
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
          roleError.textContent = data.message;
          roleError.style.display = "block";
        } else if (isOtherError) {
          otherError.textContent = data.message;
          otherError.style.display = "block";
        }
        console.error("Erreur partage d'agenda : " + data.message);
      }
    })
    .catch((error) => console.error("Erreur:", error));
}

function applyRoleDropdownListeners() {
  // Écouteur pour les boutons de suppression
  document.querySelectorAll(".remove-guest-button").forEach((button) => {
    //Ecouteur pour la suppression d'un guest
    button.addEventListener("click", (event) => {
      const guestItem = event.target.closest(".guest-item");
      const guestListItem = guestItem.closest("li");
      const guestId = guestItem.dataset.guestId;
      const updatedData = {
        guestId: guestId
      };

      // Mise à jour de la BDD
      fetch("/api/agenda/removeGuest", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      })
        .then((response) => {
          if (response.ok) {
            // Suppression réussie, on supprime la ligne
            guestListItem.remove();
          }
        })
        .catch((error) => console.error("Erreur:", error));
    });
  });

  // Écouteur pour les boutons de rôle
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

  // Écouteur pour le changement de rôle
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
        .then((data) => {
          addFlashMessages(data.flashMessages);
        })
        .catch((error) => console.error("Erreur:", error));
    });
  });
}
