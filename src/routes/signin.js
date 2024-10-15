import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page d'inscription
 */
export default class SignInRouteur extends Routeur {
  /**
   * Construit la route
   */
  constructor(server) {
    super(server, null);
  }

  /**
   * Construit la route
   */
  build() {
    this.router.get("/signin", (req, res) => {
      res.render("signin", { title: "Inscription", name: "Nico" });
    });
  }
}
