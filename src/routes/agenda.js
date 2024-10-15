import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page de l'agenda
 */
class AgendaRouteur extends Routeur {
  constructor(server) {
    super(server, null);
  }

  /**
   * Construit la route
   */
  build() {
    this.router.get("/agenda", (req, res) => {
      res.render("agenda");
    });
  }
}

export default AgendaRouteur;
