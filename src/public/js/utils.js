/**
 * Hash un texte avec l'algorithme SHA-256
 * @param input {string} Le texte à hasher
 * @returns {Promise<string>} Le hash
 */
export async function hashSHA256(input) {
  const textBuffer = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", textBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
}

/**
 * Vérifie le mot de passe et soumet le formulaire
 * @param password {string} Le mot de passe
 * @param passwordMessage {HTMLElement} L'élément d'affichage des erreurs de mot de passe
 * @param passwordConfirmation {string} La confirmation du mot de passe
 * @param passwordRepeatedMessage {HTMLElement} L'élément d'affichage des erreurs de confirmation du mot de passe
 * @param accountForm {HTMLFormElement} Le formulaire de compte
 * @returns {Promise<void>}
 */
export async function checkPassword(
  password,
  passwordMessage,
  passwordConfirmation,
  passwordRepeatedMessage,
  accountForm
) {
  if (password.length < 8) {
    passwordMessage.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
  } else if (password !== passwordConfirmation) {
    passwordRepeatedMessage.textContent = "Les mots de passe ne correspondent pas.";
  } else {
    const rawValue = accountForm.password.value;
    accountForm.password.value = await hashSHA256(rawValue);
    accountForm.submit();
    accountForm.password.value = rawValue;
  }
}

/**
 * Ajoute un message flash
 * @param messages {string[]} Les messages à afficher
 */
export function addFlashMessages(messages) {
  const flashContainer = document.querySelector(".flash-container"); // Le conteneur existant
  for (const message of messages) {
    const flashMessage = document.createElement("div");
    flashMessage.className = "alert-notif";
    flashMessage.innerText = message;

    flashContainer.appendChild(flashMessage);

    // Affiche avec un timer, comme dans le script existant
    setTimeout(() => {
      flashMessage.remove();
    }, 3000); // 3 secondes
  }
}
