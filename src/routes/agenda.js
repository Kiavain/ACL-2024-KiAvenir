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
      // Vérifie si l'utilisateur est connecté
      if (!req.cookies["accessToken"]) {
        return res.redirect("/login");
      }

      res.render("agenda");
    });
  }
}
