import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page d'accueil
 */
class HomepageRouteur extends Routeur {
  constructor() {
    super();
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

const homepageRoute = new HomepageRouteur();
export default homepageRoute.router;
