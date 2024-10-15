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
    if (password.length < 8) {
      passwordMessage.textContent =
        "Le mot de passe doit contenir au moins 8 caractères.";
    } else if (password !== passwordConfirmation) {
      passwordRepeatedMessage.textContent =
        "Les mots de passe ne correspondent pas.";
    } else {
      const rawValue = accountForm.password.value;
      accountForm.password.value = await hashSHA256(rawValue);
      accountForm.submit();
      accountForm.password.value = rawValue;
    }
  } else {
    accountForm.submit();
  }

  // Empêche la soumission du formulaire si un champ est incorrect
  if (!accountForm.checkValidity()) {
    e.preventDefault();
  }
}
