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

    this.router.put("/api/agenda/create", this.controller.createAgenda);
    this.router.put("/api/agenda/:agendaId/update", this.controller.updateAgenda);
    this.router.put("/api/agenda/:agendaId/shareAgenda", this.controller.shareAgenda);
    this.router.put("/api/agenda/updateGuest", this.controller.updateGuest);
    this.router.delete("/api/agenda/removeGuest", this.controller.removeGuest);

    this.router.get("/getGuests", (req, res) => {
      const agendaId = parseInt(req.query.agendaId);

      // Filtrer les invités pour cet agenda
      const guests = this.server.database.tables.get("guests").filter((guest) => guest.agendaId === agendaId);

      // Retourner les invités filtrés en JSON
      res.json(
        guests.map((guest) => ({
          id: guest.id,
          username: guest.getGuest().username,
          role: guest.getRole()
        }))
      );
    });

    // Visualisation de plusieurs agendas
    this.router.get("/agenda/:agendaIds", async (req, res) => {
      if (!res.locals.user) {
        req.flash("notifications", "Vous devez être connecté pour accéder à cette page.");
        return res.redirect("/login");
      }

      // Récupère les IDs des agendas depuis l'URL et les transforme en tableau
      const agendaIds = req.params.agendaIds.split(",").map((id) => parseInt(id.trim()));

      // Récupère tous les agendas dont les IDs correspondent à ceux passés dans l'URL
      const agendas_to_consult = this.server.database.tables
        .get("agendas")
        .filter((agenda) => agendaIds.includes(agenda.agendaId) && agenda.ownerId === res.locals.user.id);

      const agendas = this.server.database.tables.get("agendas");
      const guests = this.server.database.tables.get("guests");
      const guestsShared = guests.filter((guest) => guest.guestId === res.locals.user.id);

      if (agendas_to_consult.length > 0) {
        const agenda = agendas_to_consult[0];
        res.render("agenda", { agenda, agendas_to_consult, agendas, guests, guestsShared });
      } else {
        res.redirect("/agenda");
      }
    });
  }
}
