import Routeur from "../structures/Routeur.js";
import { createAccount, login, logout, deleteAccount } from '../controllers/accountController.js';

/**
 * Les routes liées à l'authentification
 */
class AccountRouteur extends Routeur {
  constructor() {
    super();
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    // Page d'inscription
    this.router.get("/signin", (req, res) => {
      res.render("signin", { title: "Inscription" });
    });

    // Page de connexion
    this.router.get("/login", (req, res) => {
      res.render("login", { title: "Connexion" });
    });

    // Actions réalisées sur un compte (création, connexion, déconnexion et suppression)
    this.router.post('/account/new', createAccount);
    this.router.post('/account/login', login);
    this.router.get('/account/logout', logout);
    this.router.get('/account/delete', deleteAccount);

    // Page "Mon compte"
    this.router.get("/account", (req, res) => {
      res.render("account");
    });
  }
}

const accountRoute = new AccountRouteur();
export default accountRoute.router;