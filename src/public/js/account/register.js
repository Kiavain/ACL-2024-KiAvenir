import { checkEmail, checkPassword } from "../utils.js";

// Active l'enregistrement d'un compte lors du chargement du document
document.addEventListener("DOMContentLoaded", () => register());

/**
 * Enregistre un compte utilisateur
 * @returns {void}
 */
function register() {
  const accountForm = document.forms["accountCreation"];
  accountForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await validateAccountCreation(e);
  });
}

/**
 * Valide la création
 * @param e {Event} L'événement de soumission du formulaire
 * @returns {Promise<void>}
 */
async function validateAccountCreation(e) {
  // Récupère le formulaire
  const accountForm = document.forms["accountCreation"];

  // Récupère le champ de l'adresse mail
  const emailInput = accountForm.email;

  emailInput.addEventListener("input", () => {
    emailInput.setCustomValidity(""); // Efface l'erreur dès que l'utilisateur modifie le champ (nécessaire sinon le formulaire se bloque définitivement)
  });

  const emailIsEmpty = emailInput.value === "";
  let emailIsCorrect = !emailIsEmpty;

  if (emailIsEmpty) {
    e.preventDefault();
    return;
  }

  // Vérifie le format de l'adresse mail (regex)
  emailIsCorrect = await checkEmail(emailInput);

  if (!emailIsCorrect) {
    e.preventDefault();
    return;
  }

  // Récupère les labels des messages d'erreur
  const passwordMessage = document.getElementById("passwordMessage");
  const passwordRepeatedMessage = document.getElementById("passwordRepeatedMessage");
  passwordMessage.textContent = "";
  passwordRepeatedMessage.textContent = "";

  // Récupère les champs de mot de passe
  const passwordRepeated = document.getElementById("passwordRepeated");
  const password = accountForm.password.value;
  const passwordConfirmation = passwordRepeated.value;

  // Applique les vérifications de mot de passe
  await checkPassword(password, passwordMessage, passwordConfirmation, passwordRepeatedMessage, accountForm);

  // Empêche la soumission du formulaire si un champ est incorrect
  if (!accountForm.checkValidity()) {
    e.preventDefault();
  }

  console.log("fin de la fonction");
}
