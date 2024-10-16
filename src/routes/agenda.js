import Routeur from "../structures/Routeur.js";
import { AgendaController } from "../controllers/agendaController.js";

/**
 * Les routes liées à la page de l'agenda
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par le serveur
export default class AgendaRouteur extends Routeur {
  constructor(server) {
    super(server, new AgendaController(server));
  }

  /**
   * Construit la route
   */
  build() {
    // Redirection vers l'agenda par défaut : le premier de la liste
    this.router.get("/agenda", (req, res) => {
      if (!res.locals.user) {
        req.flash("notifications", "Vous devez être connecté pour accéder à cette page.");
        return res.redirect("/login");
      }

      // Récupérer le premier agenda de la liste pour l'utilisateur courant
      const agenda = this.server.database.tables
        .get("agendas")
        .filter((agenda) => agenda.ownerId === res.locals.user.id);
      res.redirect("/agenda/" + agenda[0].agendaId);
    });

    this.router.get("/agenda/:agendaId", async (req, res) => {
      if (!res.locals.user) {
        req.flash("notifications", "Vous devez être connecté pour accéder à cette page.");
        return res.redirect("/login");
      }

      const agenda = await this.server.database.tables.get("agendas").get(req.params.agendaId);
      const agendas = this.server.database.tables.get("agendas");
      if (agenda) {
        res.render("agenda", { agenda, agendas });
      } else {
        res.status(404).json({ success: false, message: "Agenda non trouvé" });
      }
    });

    this.router.put("/api/agenda/create", this.controller.createAgenda);
    this.router.put("/api/agenda/:agendaId/update", this.controller.updateAgenda);
  }
}
