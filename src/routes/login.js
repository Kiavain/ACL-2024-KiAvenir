import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page d'inscription
 */
class LogInRouteur extends Routeur {
  /**
   * Construit la route
   */
  constructor() {
    super();
  }

  /**
   * Construit la route
   */
  build() {
    this.router.get("/login", (req, res) => {
      res.render("login", { title: "Connexion" });
    });
  }
}

const logInRouteur = new LogInRouteur();
export default logInRouteur.router;
