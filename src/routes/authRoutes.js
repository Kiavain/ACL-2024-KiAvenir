import Routeur from "../structures/Routeur.js";
import { createAccount, authenticate, login, logout } from '../controllers/authController.js';

/**
 * Les routes liées à l'authentification
 */
class AuthRouteur extends Routeur {
  constructor() {
    super();
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    this.router.post('/account/new', createAccount);
    this.router.post('/account/login', login);
    this.router.post('/account/logout', logout);
  }
}

const authRoute = new AuthRouteur();
export default authRoute.router;