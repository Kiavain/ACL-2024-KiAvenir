import Routeur from '../structures/Routeur.js';
import moment from 'moment';

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
    this.router.delete('/api/events/delete/:eventId', async (req, res) => {
      // Vérifie si l'utilisateur est connecté
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: 'Vous devez être connecté pour effectuer cette action'
        });
      }

      const { recurrence, applyToAll } = req.body;

      if (Number(recurrence) === 4) {
        // Suppression d'un seul événement qui ne se répète pas
        const event = this.server.database.tables.get('events').get(req.params.eventId);
        if (event) {
          await event.delete();
          res.json({ success: true });
        } else {
          res.json({ success: false });
        }
      } else if (applyToAll) {
        // Suppression de toutes les récurrences d'un événement
        const occ = this.server.database.tables.get('event_occurrences').get(req.params.eventId);
        let parentEventId = occ.eventId;
        const event = this.server.database.tables.get('events').get(parentEventId);
        if (event) {
          await event.delete();
          const occurrences = this.server.database.tables
            .get('event_occurrences')
            .filter((o) => o.eventId === event.eventId);
          for (const occurrence of occurrences) {
            await occurrence.delete();
          }
          res.json({ success: true });
        } else {
          res.json({ success: false });
        }
      } else {
        // Suppression d'une seule occurrence
        const event = this.server.database.tables.get('event_occurrences').get(req.params.eventId);
        if (event) {
          await event.update({ isCancelled: true });
          res.json({ success: true });
        } else {
          res.json({ success: false });
        }
      }
    });

    this.router.put('/api/events/update/:eventId', async (req, res) => {
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: 'Vous devez être connecté pour effectuer cette action.'
        });
      }

      let { title, description, start, end, allDay, recurrence, occurrence, unit, interval, applyToAll } = req.body;
      const oldRecurrence = req.body.oldRecurrence;
      const sentId = req.body.sentId;

      const occurrencesTable = this.server.database.tables.get('event_occurrences');
      if (!title || !start || !end) {
        return res.json({
          success: false,
          message: 'Les champs titre, date de début et date de fin sont obligatoires.'
        });
      }

      const event = this.server.database.tables.get('events').get(sentId);
      if (!event.getAgenda().verifyCanEdit(parseInt(res.locals.user.id))) {
        return res.json({
          success: false,
          message: "Vous n'avez pas la permission de modifier cet événement"
        });
      }

      if (allDay) {
        let endDate = new Date(req.body.end);
        let startDate = new Date(req.body.start);
        endDate.setUTCHours(endDate.getUTCHours() + 1);
        startDate.setUTCHours(startDate.getUTCHours() + 1);
        end = endDate.toISOString();
        start = startDate.toISOString();
      }

      const fieldsToUpdate = {
        name: title,
        description: description,
        occurrenceStart: start,
        occurrenceEnd: end,
        startDate: start,
        endDate: end,
        allDay: allDay,
        recurrence: recurrence,
        unit: unit,
        interval: interval
      };

      let table = 'events';
      let oldRec = Number(oldRecurrence);
      if (occurrence === 1 && oldRec !== 4) {
        // Distinction entre événement et occurrence => ajout des champs unit et interval
        table = 'event_occurrences';
      }

      try {
        let eventId = Number(sentId);
        const event = this.server.database.tables.get(table).get(eventId);

        if (!event) {
          return res.json({
            success: false,
            message: 'Événement ou occurrence introuvable.'
          });
        }
        await event.update(fieldsToUpdate);
        const occurrences_to_update = this.server.database.tables
          .get('event_occurrences')
          .filter((o) => o.eventId === event.eventId && !o.isCancelled && o.occurrenceId !== event.occurrenceId);
        let rec = Number(recurrence);
        if (oldRecurrence === rec && unit === event.unit && interval === event.interval) {
          // Aucun changement à apporter pour les occurrences
          event.update(fieldsToUpdate);
        } else {
          if (occurrences_to_update.length > 0) {
            if (applyToAll) {
              for (const occurrence of occurrences_to_update) {
                await occurrence.update({
                  name: title,
                  description: description
                });
              }
            }
            if (rec === 5) {
              let startDate = new Date(event.occurrenceStart);
              let endDate = new Date(event.occurrenceEnd);
              for (const occurrence of occurrences_to_update) {
                handleFlexibleRecurrence(startDate, unit, interval);
                handleFlexibleRecurrence(endDate, unit, interval);

                await occurrence.update({
                  occurrenceStart: startDate.toISOString(),
                  occurrenceEnd: endDate.toISOString(),
                  unit: unit,
                  interval: interval
                });
              }
            } else if (rec === 4) {
              for (const occurrence of occurrences_to_update) {
                await occurrence.update({
                  isCancelled: true
                });
              }
            } else {
              let startDate = new Date(event.occurrenceStart);
              let endDate = new Date(event.occurrenceEnd);
              for (const occurrence of occurrences_to_update) {
                handleFlexibleRecurrence(startDate, rec, 1);
                handleFlexibleRecurrence(endDate, rec, 1);

                await occurrence.update({
                  occurrenceStart: startDate.toISOString(),
                  occurrenceEnd: endDate.toISOString(),
                  unit: rec,
                  interval: 1
                });
              }
            }
          } else {
            // Si aucune occurrence à mettre à jour, on crée les occurrences
            if (rec !== 4) {
              const debut = new Date(start);
              const ending = new Date(end);
              let maxOccurrences = 300;
              let count = 0;
              let currentDate = new Date(debut);
              while (
                currentDate <= new Date(debut.getTime() + 2 * 365 * 24 * 60 * 60 * 1000) &&
                count < maxOccurrences
              ) {
                const occurrenceStart = new Date(currentDate);
                const occurrenceEnd = new Date(currentDate.getTime() + (ending - debut));
                await occurrencesTable.create({
                  eventId: eventId,
                  name: title,
                  description: description,
                  allDay: allDay,
                  occurrenceStart: occurrenceStart.toISOString(),
                  occurrenceEnd: occurrenceEnd.toISOString(),
                  unit: unit,
                  interval: interval
                });
                handleFlexibleRecurrence(currentDate, unit, interval);
                count++;
              }
            } else {
              event.update({
                name: title,
                description: description,
                startDate: start,
                endDate: adjustedEnd,
                allDay: allDay
              });
            }
          }
        }
        res.json({
          success: true,
          message: 'Mise à jour effectuée avec succès.'
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour :', error);
        res.json({
          success: false,
          message: 'Une erreur est survenue lors de la mise à jour.'
        });
      }
    });

    // Route pour créer un événement
    this.router.post('/api/events/create', (req, res) => {
      if (!res.locals.user) {
        return res.json({
          success: false,
          message: 'Vous devez être connecté pour effectuer cette action'
        });
      }

      const eventsTable = this.server.database.tables.get('events');
      const occurrencesTable = this.server.database.tables.get('event_occurrences');

      if (!eventsTable) {
        return res.json({
          success: false,
          message: "Vous n'avez pas la permission de créer un événement dans cet agenda"
        });
      }

      const events = this.server.database.tables.get('events');

      /// Vérifie si l'utilisateur a accès à l'agenda
      const agenda = this.server.database.tables.get('agendas').get(req.body.agendaId);
      if (!agenda || !agenda.verifyCanEdit(parseInt(res.locals.user.id))) {
        return res.json({
          success: false,
          message: "Vous n'avez pas la permission de créer un événement dans cet agenda"
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
          if (req.body.recurrence !== 4) {
            const start = new Date(req.body.startDate);
            const end = new Date(req.body.endDate);
            const occurrences = [];
            let currentDate = new Date(start);

            // Limitation à 2 ans (2 * 365 * 24 * 60 * 60 * 1000 = 2 ans en millisecondes)
            while (currentDate <= new Date(start.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)) {
              const occurrenceStart = new Date(currentDate);
              const occurrenceEnd = new Date(currentDate.getTime() + (end - start));

              // Gestion des récurrences flexibles ou non
              if (req.body.recurrence !== 5) {
                req.body.interval = 1;
                req.body.unit = req.body.recurrence;
              }

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
              handleFlexibleRecurrence(currentDate, req.body.unit, req.body.interval);
            }

            // Création des occurrences en lot
            for (const occurrence of occurrences) {
              occurrencesTable.create(occurrence);
            }
          }
          res.json({ success: true, message: 'Événement créé avec succès' });
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

    this.router.get('/api/events/:agendaIds', async (req, res) => {
      if (!res.locals.user) {
        return res.json([]);
      }

      const { filter, start, end } = req.query;
      let { agendaIds } = req.params;

      if (!start || !end) {
        return res.json([]);
      }

      agendaIds = agendaIds.split(',').map((id) => parseInt(id.trim()));

      // Synchronisation avec la base de données
      await this.server.database.sync();

      let allEvents = [];

      // Parcours chaque agendaId
      for (const agendaId of agendaIds) {
        let agenda = this.server.database.tables.get('agendas').get(agendaId);
        if (!agenda) {
          continue;
        }

        // Récupère les événements non récurrents
        const events = agenda.getEvents().filter((e) => {
          const isWithinDateRange = new Date(e.startDate) <= new Date(end) && new Date(e.endDate) >= new Date(start);
          const matchesSearch = filter ? e.name.toLowerCase().includes(filter.toLowerCase()) : true;
          return agendaId === e.agendaId && isWithinDateRange && matchesSearch && e.recurrence === 4;
        });

        // Récupère les occurrences d'événements récurrents
        const recurringEvents = this.server.database.tables.get('event_occurrences').filter((o) => {
          const isWithinDateRange =
            new Date(o.occurrenceStart) <= new Date(end) && new Date(o.occurrenceEnd) >= new Date(start);
          const matchesSearch = filter ? o.name.toLowerCase().includes(filter.toLowerCase()) : true;
          const parentEventInAgenda = agenda
            .getEvents()
            .map((e) => e.eventId)
            .includes(o.eventId);

          // Vérifie si l'ID de l'occurrence appartient à un événement valide
          return isWithinDateRange && matchesSearch && parentEventInAgenda && !o.isCancelled;
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
          agendaId,
          canEdit: agenda.verifyCanEdit(parseInt(res.locals.user.id))
        }));

        // Mappe les occurrences dans le bon format
        const formattedOccurrences = recurringEvents.map((o) => ({
          occurrenceId: o.occurrenceId,
          eventId: o.eventId,
          description: o.description,
          title: o.name,
          start: moment(o.occurrenceStart).toISOString(),
          end: moment(o.occurrenceEnd).toISOString(),
          color: agenda.color,
          allDay: o.allDay,
          isCancelled: o.isCancelled,
          unit: o.unit,
          interval: o.interval,
          canEdit: agenda.verifyCanEdit(parseInt(res.locals.user.id)),
          recurrence: 5
        }));

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(formattedEvents, formattedOccurrences);
      }

      console.log(allEvents.length);
      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
