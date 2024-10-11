import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page de l'agenda
 */
class AgendaRouteur extends Routeur {
  constructor() {
    super();
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

const agendaRouteur = new AgendaRouteur();
export default agendaRouteur.router;
