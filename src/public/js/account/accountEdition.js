import { checkEmail, checkPassword } from "../utils.js";
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
  // Récupère le formulaire
  const accountForm = document.forms["accountEdition"];

  // Récupère le champ de l'adresse mail
  const emailInput = accountForm.email;

  emailInput.addEventListener("input", () => {
    emailInput.setCustomValidity(""); // Efface l'erreur dès que l'utilisateur modifie le champ (nécessaire sinon le formulaire se bloque définitivement)
  });

  const emailIsEmpty = emailInput.value.trim() === "";
  let emailIsCorrect = !emailIsEmpty;

  if (emailIsEmpty) {
    emailInput.setCustomValidity("L'adresse mail est obligatoire.");
    emailInput.reportValidity();

    emailInput.addEventListener("input", () => {
      emailInput.setCustomValidity("");
    });
    e.preventDefault();
    return;
  }

  const username = accountForm.username.value;
  if (username.trim() === "") {
    accountForm.username.setCustomValidity("Le nom d'utilisateur est obligatoire.");
    accountForm.username.reportValidity();

    accountForm.username.addEventListener("input", () => {
      accountForm.username.setCustomValidity("");
    });
    e.preventDefault();
    return;
  }

  // Vérifie le format de l'adresse mail (regex)
  emailIsCorrect = await checkEmail(emailInput);

  if (!emailIsCorrect) {
    e.preventDefault();
    return;
  }

  const passwordMessage = document.getElementById("passwordMessage");
  const passwordRepeated = document.getElementById("passwordRepeated");
  const passwordRepeatedMessage = document.getElementById("passwordRepeatedMessage");
  passwordMessage.textContent = "";
  passwordRepeatedMessage.textContent = "";

  let password = accountForm.password.value;
  let passwordConfirmation = passwordRepeated["value"];

  if (password !== "" || passwordConfirmation !== "") {
    await checkPassword(password, passwordMessage, passwordConfirmation, passwordRepeatedMessage, accountForm);
  } else {
    accountForm.submit();
  }

  // Empêche la soumission du formulaire si un champ est incorrect
  if (!accountForm.checkValidity()) {
    e.preventDefault();
  }
}
