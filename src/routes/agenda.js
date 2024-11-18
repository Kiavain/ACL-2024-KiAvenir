import Routeur from "../structures/Routeur.js";
import { AgendaController } from "../controllers/AgendaController.js";
import multer from "multer";

/**
 * Les routes liées à la page de l'agenda
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par le serveur
export default class AgendaRouteur extends Routeur {
  /**
   * Construit le routeur
   * @param server {KiAvenir} L'instance du serveur
   * @constructor
   * @override
   */
  constructor(server) {
    super(server, new AgendaController(server));
  }

  /**
   * Construit la route
   * @override
   */
  build() {
    const upload = multer({ dest: "uploads/" });
    this.router
      // Rendu des pages
      .get("/agenda", this.controller.renderAgenda)
      .get("/agenda/:agendaIds", async (req, res) => {
        if (!res.locals.user) {
          req.flash("Vous devez être connecté pour accéder à cette page.");
          return res.redirect("/login");
        }

        // Récupère les IDs des agendas depuis l'URL et les transforme en tableau
        const agendaIds = req.params.agendaIds.split(",").map((id) => parseInt(id.trim()));

        // Récupère tous les agendas dont les IDs correspondent à ceux passés dans l'URL
        const agendas_to_consult = this.server.database.tables
          .get("agendas")
          .filter((agenda) => agendaIds.includes(agenda.agendaId) && agenda.verifyAgendaAccess(res.locals.user.id));

        const agendas = this.server.database.tables.get("agendas");
        const guests = this.server.database.tables.get("guests");
        const guestsShared = guests.filter((guest) => guest.guestId === res.locals.user.id);

        if (agendas_to_consult.length > 0) {
          const agenda = agendas_to_consult[0];
          res.render("agenda", { agenda, agendas_to_consult, agendas, guests, guestsShared });
        } else {
          res.redirect("/agenda");
        }
      })

      // Gesion des agendas
      .put("/api/agenda/create", this.controller.createAgenda)
      .put("/api/agenda/:agendaId/update", this.controller.updateAgenda)
      .put("/api/agenda/:agendaId/exportAgenda", this.controller.exportAgenda)
      .put("/api/agenda/importAgenda", upload.single("file"), this.controller.importAgenda)
      .delete("/api/agenda/:agendaId/delete", this.controller.deleteAgenda)

      // Gestion des invités
      .get("/getGuests", this.controller.getGuests)
      .put("/api/agenda/:agendaId/shareAgenda", this.controller.shareAgenda)
      .put("/api/agenda/updateGuest", this.controller.updateGuest)
      .delete("/api/agenda/removeGuest", this.controller.removeGuest);
  }
}
