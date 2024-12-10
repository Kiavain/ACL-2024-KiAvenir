import { checkEmail, hashSHA256 } from '../utils.js';

// Active l'enregistrement d'un compte lors du chargement du document
document.addEventListener('DOMContentLoaded', () => register());

/**
 * Enregistre un compte utilisateur
 * @returns {void}
 */
function register() {
  const accountForm = document.forms['accountCreation'];
  accountForm.addEventListener('submit', async (e) => {
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
  const accountForm = document.forms['accountCreation'];

  // Récupère le champ de l'adresse mail
  const emailInput = accountForm.email;
  const usernameInput = accountForm.username;

  emailInput.addEventListener('input', () => {
    emailInput.setCustomValidity(''); // Efface l'erreur dès que l'utilisateur modifie le champ (nécessaire sinon le formulaire se bloque définitivement)
  });

  const emailIsEmpty = emailInput.value === '';
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
  const passwordMessage = document.getElementById('passwordMessage');
  const passwordRepeatedMessage = document.getElementById('passwordRepeatedMessage');
  const usernameTaken = document.getElementById('usernameTaken');
  const emailTaken = document.getElementById('emailTaken');
  passwordMessage.textContent = '';
  passwordRepeatedMessage.textContent = '';
  usernameTaken.textContent = '';
  emailTaken.textContent = '';

  // Récupère les champs de mot de passe
  const passwordRepeated = document.getElementById('passwordRepeated');
  const password = accountForm.password.value;
  const passwordConfirmation = passwordRepeated.value;

  // Applique les vérifications de mot de passe
  if (password.length < 8) {
    passwordMessage.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
  } else if (password !== passwordConfirmation) {
    passwordRepeatedMessage.textContent = 'Les mots de passe ne correspondent pas.';
  } else {
    const rawValue = accountForm.password.value;
    const formData = {
      email: emailInput.value,
      username: usernameInput.value,
      password: await hashSHA256(rawValue)
    };

    // Effectuer une requête fetch
    try {
      const response = await fetch(accountForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Vérifier si la réponse est réussie
      if (response.ok) {
        const result = await response.json();
        const agendaId = result.agendaId;
        localStorage.setItem('selectedAgendaIds', JSON.stringify([agendaId]));
        window.location.href = '/agenda';
      } else {
        const error = await response.json();
        usernameTaken.textContent = error.usernameTaken ? "Ce nom d'utilisateur est déjà pris." : '';
        emailTaken.textContent = error.emailTaken ? 'Cette adresse mail est déjà utilisée.' : '';
        passwordMessage.textContent = error.passwordTooShort
          ? 'Le mot de passe doit contenir au moins 8 caractères.'
          : '';
      }
    } catch (error) {
      passwordMessage.textContent = 'Une erreur est survenue lors de la connexion.';
      console.error(error);
    } finally {
      accountForm.password.value = rawValue; // Restaurer la valeur brute
    }
  }

  // Empêche la soumission du formulaire si un champ est incorrect
  if (!accountForm.checkValidity()) {
    e.preventDefault();
  }
}
