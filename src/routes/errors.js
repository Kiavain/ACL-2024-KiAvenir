import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées aux erreurs
 */
export default class ErrorsRouteur extends Routeur {
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
    this.router
      .get("/404", (req, res) => {
        res.render("errors/404", { err: true });
      })
      .get("/403", (req, res) => {
        res.render("errors/403", { err: true });
      })
      .get("/401", (req, res) => {
        res.render("errors/401", { err: true });
      });
  }
}
