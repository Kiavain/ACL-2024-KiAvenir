import Routeur from "../structures/Routeur.js";
import { AccountController } from "../controllers/accountController.js";

/**
 * Les routes liées à l'authentification
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par le serveur
export default class AccountRouteur extends Routeur {
  constructor(server) {
    super(server, new AccountController(server));
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    this.router
      // Accès aux pages d'inscription, de connexion et de compte
      .get("/signin", this.controller.renderSignin)
      .get("/login", this.controller.renderLogin)
      .get("/account", this.controller.renderAccount)

      // Actions réalisées sur un compte (création, connexion, déconnexion et suppression)
      .post("/account/new", this.controller.createAccount)
      .post("/account/login", this.controller.login)
      .post("/account/logout", this.controller.logout)
      .post("/account/edit", this.controller.editAccount)
      .post("/account/delete", this.controller.deleteAccount);
  }
}
