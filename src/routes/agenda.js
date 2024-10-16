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
      if (!req.cookies["accessToken"]) {
        req.flash(
          "notifications",
          "Vous devez être connecté pour accéder à cette page."
        );
        return res.redirect("/login");
      }

      const agendas = this.server.database.tables.get("agendas");
      res.render("agenda", { agendas, agendaId: 0 });
    });
  }
}
