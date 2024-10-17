import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page d'accueil
 */
export default class HomepageRouteur extends Routeur {
  constructor(server) {
    super(server, null);
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    this.router.get("/", (req, res) => {
      res.render("homepage");
    });
  }
}
