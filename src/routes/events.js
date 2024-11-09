import Routeur from "../structures/Routeur.js";
import moment from "moment";

/**
 * Les routes liées à la page des événements
 */
export default class EventRouteur extends Routeur {
  constructor(server) {
    super(server, null);
  }

  /**
   * Construit la route
   */
  build() {
    this.router.delete("/api/events/delete/:eventId", async (req, res) => {
      // Vérifie si l'utilisateur est connecté
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: "Vous devez être connecté pour effectuer cette action"
        });
      }

      const event = this.server.database.tables.get("events").get(req.params.eventId);
      if (event) {
        await event.delete();
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    });

    this.router.put("/api/events/update/:eventId", (req, res) => {
      // Vérifie si l'utilisateur est connecté
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: "Vous devez être connecté pour effectuer cette action"
        });
      }

      const event = this.server.database.tables.get("events").get(req.params.eventId);
      const fields = {
        name: req.body.title,
        description: req.body.description,
        startDate: req.body.start,
        endDate: req.body.end
      };

      if (event) {
        event
          .update(fields)
          .then(() => {
            res.json({
              success: true,
              message: "Événement mis à jour avec succès"
            });
          })
          .catch(() => {
            res.json({
              success: false,
              message: "Erreur lors de la mise à jour de l'événement"
            });
          });
      } else {
        res.json({
          success: false,
          message: "Erreur lors de la mise à jour de l'événement"
        });
      }
    });

    // Route pour créer un événement
    this.router.post("/api/events/create", (req, res) => {
      // Vérifie si l'utilisateur est connecté
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: "Vous devez être connecté pour effectuer cette action"
        });
      }

      const newEvent = this.server.database.tables.get("events");
      if (newEvent) {
        newEvent
          .create(req.body)
          .then(() => {
            res.json({ success: true, message: "Événement créé avec succès" });
          })
          .catch(() => {
            res.json({
              success: false,
              message: "Erreur lors de la création de l'événement"
            });
          });
      } else {
        res.json({
          success: false,
          message: "Erreur lors de la création de l'événement"
        });
      }
    });

    this.router.get("/api/events/:agendaIds", async (req, res) => {
      if (!res.locals.user) {
        return res.json([]);
      }

      const search = req.query.search;
      const start = req.query.start;
      const end = req.query.end;

      // Vérifie que start et end sont définis
      if (!start || !end) {
        return res.json([]);
      }

      const agendaIds = req.params.agendaIds.split(",").map((id) => parseInt(id.trim()));

      // Synchronisation avec la base de données
      await this.server.database.sync();

      let allEvents = [];

      // Parcours chaque agendaId et récupère les événements correspondants
      for (const agendaId of agendaIds) {
        const agenda = this.server.database.tables.get("agendas").get(agendaId);

        // Continue si l'agenda n'existe pas
        if (!agenda) {
          continue;
        }

        // Récupère les événements pour cet agenda spécifique
        const events = agenda
          .getEvents()
          .filter((e) => {
            return (
              agendaId === e.agendaId &&
              (moment(e.startDate).isBetween(start, end) || moment(e.endDate).isBetween(start, end)) &&
              (!search || e.name.toLowerCase().includes(search.toLowerCase()))
            );
          })
          .map((e) => ({
            eventId: e.eventId,
            description: e.description,
            title: e.name,
            start: moment(e.startDate).format(),
            end: moment(e.endDate).format(),
            agendaId: agendaId,
            color: agenda.color,
            allDay: e.allDay
          }));

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(events);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
