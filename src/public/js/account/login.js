import { hashSHA256 } from '../utils.js';

const accountForm = document.forms['accountLogin'];
accountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await validateAccountLogin();
});

async function validateAccountLogin() {
  const passwordMessage = document.getElementById('passwordMessage');
  passwordMessage.textContent = '';

  if (accountForm.password.value.length < 8) {
    passwordMessage.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
    return; // Arrête l'exécution si le mot de passe est incorrect
  }

  const rawValue = accountForm.password.value;
  accountForm.password.value = await hashSHA256(rawValue);

  // Préparer les données à envoyer
  const formData = { username: accountForm.username.value, password: accountForm.password.value };
  accountForm.password.value = rawValue; // Restaurer la valeur brute

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
      passwordMessage.textContent = error.message;
    }
  } catch (error) {
    passwordMessage.textContent = 'Une erreur est survenue lors de la connexion.';
    console.error(error);
  } finally {
    accountForm.password.value = rawValue; // Restaurer la valeur brute
  }
}
