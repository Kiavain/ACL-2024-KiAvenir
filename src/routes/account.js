import Routeur from "../structures/Routeur.js";
import { AccountController } from "../controllers/AccountController.js";
import upload from "../utils/multer.js"; // Assure-toi que le chemin est correct

/**
 * Les routes liées à l'authentification
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par le serveur
export default class AccountRouteur extends Routeur {
  /**
   * Construit le routeur
   * @param server {KiAvenir} L'instance du serveur
   * @constructor
   * @override
   */
  constructor(server) {
    super(server, new AccountController(server));
  }

  /**
   * Implémentation de la construction des routes
   * @override
   */
  build() {
    this.router
      // Accès aux pages d'inscription, de connexion et de compte
      .get("/signin", this.controller.renderSignin)
      .get("/login", this.controller.renderLogin)
      .get("/account", this.controller.renderAccount)
      .get("/forget-password", this.controller.renderForgetPassword)
      .get("/reset-password", this.controller.renderResetPassword)

      // Actions réalisées sur un compte (création, connexion, déconnexion et suppression)
      .post("/account/new", this.controller.createAccount)
      .post("/account/login", this.controller.login)
      .post("/account/logout", this.controller.logout)
      .post("/account/edit", this.controller.editAccount)
      .post("/account/delete", this.controller.deleteAccount)
      .post("/account/edit-icon", upload.single("image"), this.controller.editUserIcon)
      .post("/api/account/forget-password", this.controller.forgetPassword)
      .post("/api/account/reset-password", this.controller.resetPassword);
  }
}
