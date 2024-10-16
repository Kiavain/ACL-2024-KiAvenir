import Routeur from "../structures/Routeur.js";
import moment from "moment";
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
    // Redirection vers l'agenda par défaut - id 1
    this.router.get("/agenda", (req, res) => {
      // Récupérer le premier agenda de la liste pour l'utilisateur courant
      const agenda = this.server.database.tables
        .get("agendas")
        .filter((agenda) => agenda.ownerId === res.locals.user.id);
      console.log("agenda:", res.locals);
      res.redirect("/agenda/" + agenda[0].agendaId);
    });

    this.router.get("/agenda/:agendaId", async (req, res) => {
      const agenda = await this.server.database.tables
        .get("agendas")
        .get(req.params.agendaId);
      const agendas = this.server.database.tables.get("agendas");
      if (agenda) {
        res.render("agenda", { agenda, agendas });
      } else {
        res.status(404).json({ success: false, message: "Agenda non trouvé" });
      }
    });

    this.router.put("/api/agenda/create", this.controller.createAgenda);
    this.router.put(
      "/api/agenda/:agendaId/update",
      this.controller.updateAgenda
    );

    this.router.get("/agenda_test", (req, res) => {
      const view = req.query.view || "month"; // Par défaut, on affiche la vue du mois
      moment.locale("fr");
      const currentDate = moment(req.query.date) || moment();

      let prevDate, nextDate, weekStart, weekEnd;

      if (view === "day") {
        prevDate = currentDate.clone().subtract(1, "day").format("YYYY-MM-DD");
        nextDate = currentDate.clone().add(1, "day").format("YYYY-MM-DD");
      } else if (view === "week") {
        weekStart = currentDate.clone().startOf("week");
        weekEnd = currentDate.clone().endOf("week");
        prevDate = weekStart.clone().subtract(1, "week").format("YYYY-MM-DD");
        nextDate = weekStart.clone().add(1, "week").format("YYYY-MM-DD");
      } else if (view === "month") {
        prevDate = currentDate
          .clone()
          .subtract(1, "month")
          .format("YYYY-MM-DD");
        nextDate = currentDate.clone().add(1, "month").format("YYYY-MM-DD");
      }

      // Appelle la fonction qui retourne les événements pour la date spécifiée
      const events = getEventsForDate(this.server, currentDate);

      res.render("agenda_test", {
        view,
        currentDate,
        prevDate,
        nextDate,
        weekStart,
        weekEnd,
        events,
        moment
      });
    });
  }
}

/**
 * Retourne les événements
 * @param server {KiAvenir}
 * @param currentDate {moment.Moment}
 * @returns {Object[]}
 */
function getEventsForDate(server, currentDate) {
  return server.database.tables
    .get("events")
    .filter((event) => event.startDate.getMonth() === currentDate.month())
    .map((event) => {
      return {
        ...event.toJSON(),
        startDate: moment(event.startDate),
        endDate: moment(event.endDate),
        color: event.getAgenda().color,
        rgba: hexToRgba(event.getAgenda().color, 0.1)
      };
    });
}

/**
 * Convertit une couleur hexadécimale en RGBA
 * @param hex La couleur hexadécimale
 * @param alpha L'opacité
 * @returns {string} La couleur au format RGBA
 */
function hexToRgba(hex, alpha) {
  // Retirer le # si présent
  hex = hex.replace(/^#/, "");

  // Décomposer la couleur hexadécimale en RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Retourner la couleur au format RGBA avec l'opacité (alpha)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
