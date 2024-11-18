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
      //Permet de rajouter un jour au jour de Fin à un event all Day
      if (req.body.allDay) {
        let endDate = new Date(req.body.end);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        req.body.end = endDate.toISOString(); // Convertir à nouveau en chaîne ISO si nécessaire
      }
      const fields = {
        name: req.body.title,
        description: req.body.description,
        startDate: req.body.start,
        endDate: req.body.end,
        allDay: req.body.allDay,
        recurrence: req.body.recurrence
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

      const allEvents = this.server.database.tables.get("events");
      if (allEvents) {
        //Permet de rajouter un jour au jour de Fin à un event all Day
        if (req.body.allDay) {
          let endDate = new Date(req.body.endDate);
          endDate.setUTCDate(endDate.getUTCDate() + 1);
          req.body.endDate = endDate.toISOString(); // Convertir à nouveau en chaîne ISO si nécessaire
        }
        allEvents
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
              // (moment(e.startDate).isBetween(start, end) || moment(e.endDate).isBetween(start, end)) &&
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
            allDay: e.allDay,
            recurrence: e.recurrence
          }));

        // On récupère les évènements récurrents
        const recurringEvents = events.filter(event => event.recurrence != 0);
        let adjustedRecurringEvents = [];

        for (const evt of recurringEvents) {
          const startDate = new Date(evt.start);
          const endDate = new Date(evt.end);
          
          // if ((moment(startDate).isBetween(start, end) || moment(endDate).isBetween(start, end))) {
          //   adjustedRecurringEvents.push(evt);
          // }


          // Clone l'évènement
          let adjustedEvent = { ...evt };
          // adjustedEvent.eventId = 0;

          console.log("On duplique l'event " + evt.eventId + " - '" + evt.title + "' (date: " + evt.start + ", recurrence:" + evt.recurrence + ")");
          switch (evt.recurrence) {
            case 1: // Tous les jours
              startDate.setDate(startDate.getDate() + 1);
              endDate.setDate(endDate.getDate() + 1);
              break;
            case 2: // Toutes les semaines
              startDate.setDate(startDate.getDate() + 7);
              endDate.setDate(endDate.getDate() + 7);
              break;
            case 3: // Tous les mois
              startDate.setMonth(startDate.getMonth() + 1);
              endDate.setMonth(endDate.getMonth() + 1);
              break;
            case 4: // Tous les ans
              startDate.setFullYear(startDate.getFullYear() + 1);
              endDate.setFullYear(endDate.getFullYear() + 1);
              break;
            default:
              break;
          }
          adjustedEvent.start = startDate.toISOString();
          adjustedEvent.end = endDate.toISOString();

          adjustedRecurringEvents.push(adjustedEvent);
        }

        // Adjust recurring events for the current month
        // const adjustedRecurringEvents = recurringEvents.map(event => {
        //   const adjustedEvent = { ...event }; // Clone the event
        //   // console.log(adjustedEvent);
        //   const eventStartDate = new Date(event.start);
        //   const eventEndDate = new Date(event.end);
        //   eventStartDate.setMonth(eventStartDate.getMonth() + 1); // Move to current month
        //   eventEndDate.setMonth(eventEndDate.getMonth() + 1); // Move to current month
        //   adjustedEvent.start = eventStartDate.toISOString();
        //   adjustedEvent.end = eventEndDate.toISOString();
        //   return adjustedEvent;
        // });


        // console.log(adjustedRecurringEvents);

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(events, adjustedRecurringEvents);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
