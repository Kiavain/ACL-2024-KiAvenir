import { checkPassword } from "./utils.js";
const accountForm = document.forms["accountEdition"];
accountForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await validateAccountCreation(e);
});

/**
 * Valide la création d'un compte
 * @param e {Event} L'événement de soumission du formulaire
 * @returns {Promise<void>}
 */
async function validateAccountCreation(e) {
  const passwordMessage = document.getElementById("passwordMessage");
  const passwordRepeated = document.getElementById("passwordRepeated");
  const passwordRepeatedMessage = document.getElementById(
    "passwordRepeatedMessage"
  );
  passwordMessage.textContent = "";
  passwordRepeatedMessage.textContent = "";

  let password = accountForm.password.value;
  let passwordConfirmation = passwordRepeated["value"];

  if (password !== "") {
    await checkPassword(
      password,
      passwordMessage,
      passwordConfirmation,
      passwordRepeatedMessage,
      accountForm
    );
  } else {
    accountForm.submit();
  }

  // Empêche la soumission du formulaire si un champ est incorrect
  if (!accountForm.checkValidity()) {
    e.preventDefault();
  }
}
