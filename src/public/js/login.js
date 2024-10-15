import { hashSHA256 } from "./utils.js";
const accountForm = document.forms["accountLogin"];
accountForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await validateAccountLogin(e);
});

async function validateAccountLogin(e) {
  const passwordMessage = document.getElementById("passwordMessage");
  passwordMessage.textContent = "";

  if (accountForm.password.value.length < 8) {
    passwordMessage.textContent =
      "Le mot de passe doit contenir au moins 8 caractères.";
  } else {
    const rawValue = accountForm.password.value;
    accountForm.password.value = await hashSHA256(rawValue);
    accountForm.submit();
    accountForm.password.value = rawValue;
  }

  // Empêche la soumission du formulaire si un champ est incorrect
  if (!accountForm.checkValidity()) {
    e.preventDefault();
  }
}
