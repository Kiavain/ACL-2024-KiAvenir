import { addFlashMessages, hashSHA256 } from "../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const resetForm = document.forms["accountResetPassword"];
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = resetForm["password"].value;
    const passwordConfirm = resetForm["confirmPassword"].value;
    const token = resetForm["token"].value;

    if (!password || !passwordConfirm) {
      alert("Veuillez saisir votre mot de passe.");
      return;
    }

    if (password !== passwordConfirm) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    const response = await fetch("/api/account/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: await hashSHA256(password), email: token })
    });

    if (response.ok) {
      window.location.href = "/login";
    } else {
      addFlashMessages(["Erreur lors de la réinitialisation de votre mot de passe."]);
    }
  });
});
