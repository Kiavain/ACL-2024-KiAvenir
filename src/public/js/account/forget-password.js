import { addFlashMessages } from "../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const forgetForm = document.forms["accountForgetPassword"];
  forgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = forgetForm["email"].value;
    if (!email) {
      alert("Veuillez saisir votre adresse e-mail.");
      return;
    }

    const response = await fetch("/api/account/forget-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      addFlashMessages(["Un email de réinitialisation de mot de passe vous a été envoyé."]);
      forgetForm.reset();
    } else {
      addFlashMessages(["Erreur lors de l'envoi de l'email de réinitialisation de mot de passe."]);
    }
  });
});
