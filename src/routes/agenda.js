import Routeur from "../structures/Routeur.js";
import moment from "moment";

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
