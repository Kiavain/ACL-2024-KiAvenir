import { addFlashMessages, hashSHA256 } from "../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const resetForm = document.forms["accountResetPassword"];
  const errorMessage = document.getElementById("error_reset_password");

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = resetForm["password"].value;
    const passwordConfirm = resetForm["confirmPassword"].value;
    const token = resetForm["token"].value;

    if (!password || !passwordConfirm) {
      errorMessage.textContent = "Veuillez saisir votre mot de passe et le confirmer.";
      errorMessage.style.display = "block";
      return;
    }

    if (password !== passwordConfirm) {
      errorMessage.textContent = "Les mots de passe ne correspondent pas.";
      errorMessage.style.display = "block";
      return;
    }

    if (password.length < 8) {
      errorMessage.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
      errorMessage.style.display = "block";
      return;
    }

    const response = await fetch("/api/account/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: await hashSHA256(password), email: token })
    });

    errorMessage.style.display = "none";
    if (response.ok) {
      window.location.href = "/login";
    } else {
      addFlashMessages(["Erreur lors de la réinitialisation de votre mot de passe."]);
    }
  });
});
