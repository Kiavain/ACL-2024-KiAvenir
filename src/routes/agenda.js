import Routeur from "../structure/Routeur.js";

/**
 * Les routes liées à la page de l'agenda
 */
class AgendaRouteur extends Routeur {
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
    this.router.get("/agenda", (req, res) => {
      res.sendFile(this.getPathInHTML("agenda.html"));
    });
  }
}

const agendaRouteur = new AgendaRouteur();
export default agendaRouteur.router;
