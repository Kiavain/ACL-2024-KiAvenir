import Routeur from "../structures/Routeur.js";
import { createAccount, authenticate } from '../controllers/authController.js';
import Database from '../components/Database.js'; // Assuming you are importing your database here

// Use the database from your main application and pass it to the controller
const database = new Database();

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
    this.router.post('/account/new', createAccount.bind(this.app));
    this.router.post('/account/login', authenticate.bind(this.app));
  }
}

const authRoute = new AuthRouteur();
export default authRoute.router;