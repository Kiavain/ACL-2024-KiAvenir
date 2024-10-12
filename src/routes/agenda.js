import Routeur from "../structures/Routeur.js";
import moment from "moment";

/**
 * Les routes liées à la page de l'agenda
 */
class AgendaRouteur extends Routeur {
  constructor(server) {
    super(server);
  }

  /**
   * Construit la route
   */
  build() {
    this.router.get("/agenda", (req, res) => {
      res.render("agenda");
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
 * @param currentDate {moment}
 * @returns {Object[]}
 */
function getEventsForDate(server, currentDate) {
  return server.database.tables
    .get("events")
    .getAll()
    .filter((event) => event.startDate.getMonth() === currentDate.month())
    .map((event) => {
      return {
        title: event.name,
        details: event.description,
        start: moment(event.startDate),
        end: moment(event.endDate)
      };
    });
}

export default AgendaRouteur;
