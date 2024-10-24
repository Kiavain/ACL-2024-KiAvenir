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
      const guests = this.server.database.tables.get("guests");
      const guestsShared = guests.filter((guest) => guest.guestId === res.locals.user.id);
      if (agenda) {
        res.render("agenda", { agenda, agendas, guests, guestsShared });
      } else {
        res.status(404).json({ success: false, message: "Agenda non trouvé" });
      }
    });

    this.router.put("/api/agenda/create", this.controller.createAgenda);
    this.router.put("/api/agenda/:agendaId/update", this.controller.updateAgenda);
    this.router.put("/api/agenda/:agendaId/shareAgenda", this.controller.shareAgenda);
    this.router.put("/api/agenda/updateGuest", this.controller.updateGuest);
    this.router.delete("/api/agenda/removeGuest", this.controller.removeGuest);

    this.router.get("/getGuests", (req, res) => {
      const agendaId = parseInt(req.query.agendaId);

      // Filtrer les invités pour cet agenda (en utilisant ta base de données)
      const guests = this.server.database.tables.get("guests").filter((guest) => guest.agendaId === agendaId);

      // Retourner les invités filtrés en JSON
      res.json(
        guests.map((guest) => ({
          id: guest.getGuest().id,
          username: guest.getGuest().username,
          role: guest.getRole()
        }))
      );
    });
  }
}
