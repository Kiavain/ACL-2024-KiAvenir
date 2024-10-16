import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page de l'agenda
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par le serveur
export default class AgendaRouteur extends Routeur {
  constructor(server) {
    super(server, null);
  }

  /**
   * Construit la route
   */
  build() {
    this.router.get("/agenda", (req, res) => {
      const agendas = this.server.database.tables.get("agendas");
      res.render("agenda", {
        agendas,
        notifications: req.flash("notifications")
      });
    });
  }
}
