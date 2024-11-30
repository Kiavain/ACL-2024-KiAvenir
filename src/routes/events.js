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

      if (req.body.occurrence === 1) {
        console.log("Update Occurrence");
      } else {
        console.log("Update Event");
      }

      /* const event = this.server.database.tables.get("events").get(req.params.eventId);
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
      }*/
    });

    // Route pour créer un événement lambda ou avec une récurrence simple
    this.router.post("/api/events/create", async (req, res) => {
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: "Vous devez être connecté pour effectuer cette action"
        });
      }

      const eventsTable = this.server.database.tables.get("events");
      const occurrencesTable = this.server.database.tables.get("event_occurrences");

      if (!eventsTable) {
        return res.json({
          success: false,
          message: "Erreur lors de la création de l'événement"
        });
      }

      if (req.body.allDay) {
        let endDate = new Date(req.body.endDate);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        req.body.endDate = endDate.toISOString();
      }

      // Création de l'événement
      eventsTable
        .create(req.body)
        .then((newEvent) => {
          // Si l'événement est récurrent, créer les occurrences
          if (req.body.recurrence !== 0) {
            const start = new Date(req.body.startDate);
            const end = new Date(req.body.endDate);
            const occurrences = [];
            let currentDate = new Date(start);

            // Limitation à 2 ans (2 * 365 * 24 * 60 * 60 * 1000 = 2 ans en millisecondes)
            while (currentDate <= new Date(start.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)) {
              const occurrenceStart = new Date(currentDate);
              const occurrenceEnd = new Date(currentDate.getTime() + (end - start));

              occurrences.push({
                eventId: newEvent.eventId,
                name: newEvent.name,
                description: newEvent.description,
                occurrenceStart: occurrenceStart.toISOString(),
                occurrenceEnd: occurrenceEnd.toISOString(),
                allDay: newEvent.allDay,
                unit: req.body.unit,
                interval: req.body.interval
              });

              switch (req.body.recurrence) {
                case 1: // Quotidien
                  currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                  break;
                case 2: // Hebdomadaire
                  currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                  break;
                case 3: // Mensuel
                  currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                  break;
                case 4: // Annuel
                  currentDate.setUTCFullYear(currentDate.getUTCFullYear() + 1);
                  break;
                case 5: // Flexibilité
                  handleFlexibleRecurrence(currentDate, req.body.unit, req.body.interval);
                  break;
                default:
                  break;
              }
            }

            // Création des occurrences en lot
            for (const occurrence of occurrences) {
              occurrencesTable.create(occurrence);
            }
          }
          res.json({ success: true, message: "Événement créé avec succès" });
        })
        .catch((error) => console.error("Erreur lors de la création de l'événement :", error));
    });

    function handleFlexibleRecurrence(currentDate, unit, interval) {
      switch (unit) {
        case 0: // Quotidien
          currentDate.setUTCDate(currentDate.getUTCDate() + interval);
          break;
        case 1: // Hebdomadaire
          currentDate.setUTCDate(currentDate.getUTCDate() + interval * 7);
          break;
        case 2: // Mensuel
          currentDate.setUTCMonth(currentDate.getUTCMonth() + interval);
          break;
        case 3: // Annuel
          currentDate.setUTCFullYear(currentDate.getUTCFullYear() + interval);
          break;
        default:
          break;
      }
    }

    this.router.get("/api/events/:agendaIds", async (req, res) => {
      if (!res.locals.user) {
        return res.json([]);
      }

      const { search, start, end } = req.query;
      let { agendaIds } = req.params;

      if (!start || !end) {
        return res.json([]);
      }

      agendaIds = agendaIds.split(",").map((id) => parseInt(id.trim()));

      // Synchronisation avec la base de données
      await this.server.database.sync();

      let allEvents = [];

      // Parcours chaque agendaId
      for (const agendaId of agendaIds) {
        let agenda = this.server.database.tables.get("agendas").get(agendaId);
        if (!agenda) {
          continue;
        }

        // Récupère les événements non récurrents
        const events = agenda.getEvents().filter((e) => {
          const isWithinDateRange = new Date(e.startDate) <= new Date(end) && new Date(e.endDate) >= new Date(start);
          const matchesSearch = search ? e.name.toLowerCase().includes(search.toLowerCase()) : true;

          return agendaId === e.agendaId && isWithinDateRange && matchesSearch && e.recurrence === 0;
        });

        // Récupère les occurrences d'événements récurrents
        const recurringEvents = this.server.database.tables.get("event_occurrences").filter((o) => {
          const isWithinDateRange =
            new Date(o.occurrenceStart) <= new Date(end) && new Date(o.occurrenceEnd) >= new Date(start);
          const matchesSearch = search ? o.name.toLowerCase().includes(search.toLowerCase()) : true;
          const parentEventInAgenda = agenda
            .getEvents()
            .map((e) => e.eventId)
            .includes(o.eventId);

          // Vérifie si l'ID de l'occurrence appartient à un événement valide
          return isWithinDateRange && matchesSearch && parentEventInAgenda;
        });

        // Mappe les événements dans le bon format
        const formattedEvents = events.map((e) => ({
          eventId: e.eventId,
          description: e.description,
          title: e.name,
          start: moment(e.startDate).toISOString(),
          end: moment(e.endDate).toISOString(),
          color: agenda.color,
          allDay: e.allDay,
          recurrence: e.recurrence,
          agendaId
        }));

        // Mappe les occurrences dans le bon format
        const formattedOccurrences = recurringEvents.map((o) => ({
          eventId: o.eventId,
          description: o.description,
          title: o.name,
          start: moment(o.occurrenceStart).toISOString(),
          end: moment(o.occurrenceEnd).toISOString(),
          color: agenda.color,
          allDay: o.allDay,
          isCancelled: o.isCancelled,
          unit: o.unit,
          interval: o.interval
        }));

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(formattedEvents, formattedOccurrences);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
