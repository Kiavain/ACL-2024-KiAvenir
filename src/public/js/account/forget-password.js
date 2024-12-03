import { addFlashMessages, checkEmail } from "../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const forgetForm = document.forms["accountForgetPassword"];
  const errMsg = document.getElementById("error_message_forget");

  forgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = forgetForm["email"].value;
    if (!email) {
      alert("Veuillez saisir votre adresse e-mail.");
      return;
    }

    if (!(await checkEmail(forgetForm["email"]))) {
      e.preventDefault();
      return;
    }

    const response = await fetch("/api/account/forget-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const json = await response.json();

    if (json.success) {
      addFlashMessages([json.message]);
      errMsg.style.display = "none";
      forgetForm.reset();
    } else {
      errMsg.textContent = json.message;
      errMsg.style.display = "block";
    }
  });
});
