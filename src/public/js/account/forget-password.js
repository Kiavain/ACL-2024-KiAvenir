import { addFlashMessages, checkEmail } from '../utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const forgetForm = document.forms['accountForgetPassword'];
  const errMsg = document.getElementById('error_message_forget');

  forgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = forgetForm['email'].value;
    if (!email) {
      errMsg.textContent = 'Veuillez entrer votre adresse email';
      return;
    }

    if (!(await checkEmail(forgetForm['email']))) {
      errMsg.textContent = 'Adresse email invalide';
      e.preventDefault();
      return;
    }

    const response = await fetch('/api/account/forget-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const json = await response.json();
    addFlashMessages([json.message]);
    errMsg.textContent = '';
    forgetForm.reset();
  });
});
