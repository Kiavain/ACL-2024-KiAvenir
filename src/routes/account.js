import Routeur from "../structures/Routeur.js";
import {
  createAccount,
  login,
  logout,
  editAccount,
  deleteAccount
} from "../controllers/accountController.js";

/**
 * Les routes liées à l'authentification
 */
class AccountRouteur extends Routeur {
  constructor(server) {
    super(server);
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    // Page d'inscription
    this.router
      .get("/signin", (req, res) => {
        res.render("signin", { title: "Inscription" });
      })

      // Page de connexion
      .get("/login", (req, res) => {
        res.render("login", { title: "Connexion" });
      })

      // Actions réalisées sur un compte (création, connexion, déconnexion et suppression)
      .post("/account/new", (req, res) => {
        createAccount(req, res, this.server.database);
      })
      .post("/account/login", (req, res) => {
        login(req, res, this.server.database);
      })
      .get("/account/logout", logout) // cette route pourrait être mis en post, mais d'un point de vue sécurité c'est pareil donc pas important
      .post("/account/edit", (req, res) => {
        editAccount(req, res, this.server.database);
      })
      .post("/account/delete", (req, res) => {
        deleteAccount(req, res, this.server.database);
      });

    // Page "Mon compte"
    this.router.get("/account", (req, res) => {
      res.render("account");
    });
  }
}

export default AccountRouteur;
