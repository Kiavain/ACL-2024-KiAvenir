import Routeur from "../structures/Routeur.js";
import { AccountController } from "../controllers/accountController.js";

/**
 * Les routes liées à l'authentification
 */
class AccountRouteur extends Routeur {
  constructor(server) {
    super(server, new AccountController(server));
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    // Page d'inscription
    this.router
      // Page d'inscription
      .get("/signin", (req, res) => {
        res.render("signin", { title: "Inscription" });
      })
      // Page de connexion
      .get("/login", (req, res) => {
        res.render("login", { title: "Connexion" });
      })
      // Page "Mon Compte"
      .get("/account", (req, res) => {
        res.render("account");
      })

      // Actions réalisées sur un compte (création, connexion, déconnexion et suppression)
      .post("/account/new", this.controller.createAccount)
      .post("/account/login", this.controller.login)
      .get("/account/logout", this.controller.logout) // cette route pourrait être mise en post, mais d'un point de vue sécurité, c'est pareil donc pas important
      .post("/account/edit", this.controller.editAccount)
      .post("/account/delete", this.controller.deleteAccount);
  }
}

export default AccountRouteur;
