import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page d'accueil
 */
class HomepageRouteur extends Routeur {
  constructor(server) {
    super(server);
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

export default HomepageRouteur;
