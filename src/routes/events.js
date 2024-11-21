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

      const { search, start, end } = req.query;
      let { agendaIds } = req.params;

      // Vérifie que start et end sont définis
      if (!start || !end) {
        return res.json([]);
      }

      agendaIds = agendaIds.split(",").map((id) => parseInt(id.trim()));

      // Synchronisation avec la base de données
      await this.server.database.sync();

      let allEvents = [];

      // Parcours chaque agendaId et récupère les événements correspondants
      for (const agendaId of agendaIds) {
        const agenda = this.server.database.tables.get("agendas").get(agendaId);
        if (!agenda) {
          continue;
        }

        // Récupère les événements pour cet agenda spécifique
        const events = agenda
          .getEvents()
          .filter((e) => {
            return agendaId === e.agendaId && (!search || e.name.toLowerCase().includes(search.toLowerCase()));
          })
          .map((e) => ({
            eventId: e.eventId,
            description: e.description,
            title: e.name,
            start: moment(e.startDate).format(),
            end: moment(e.endDate).format(),
            color: agenda.color,
            allDay: e.allDay,
            recurrence: e.recurrence,
            agendaId
          }));

        // On récupère les évènements récurrents
        const recurringEvents = events.filter((event) => event.recurrence !== 0);
        let adjustedRecurringEvents = [];

        // Fonction pour vérifier si une année est bissextile
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

        // Parcourir les jours du calendrier affiché (entre startCalendar et endCalendar)
        let currentDate = new Date(start);
        const endCalendar = new Date(end);

        while (currentDate < endCalendar) {
          // Récupération des informations de la date actuelle en UTC
          const jour = currentDate.getUTCDate();
          const mois = currentDate.getUTCMonth() + 1; // Les mois sont de 0 à 11
          const annee = currentDate.getUTCFullYear();

          // On parcourt les évènements récurrents pour savoir si on doit en afficher un
          for (const evt of recurringEvents) {
            let displayEvent = false;
            const eventStart = new Date(evt.start);
            const eventEnd = new Date(evt.end);
            const dureeEvent = eventEnd - eventStart; // Durée de l'événement en millisecondes

            const eventStartDate = eventStart.getUTCDate();
            const eventStartMonth = eventStart.getUTCMonth() + 1;
            const eventStartYear = eventStart.getUTCFullYear();

            // On vérifie si l'évènement doit être affiché
            if (currentDate > eventStart) {
              switch (evt.recurrence) {
                case 1: // Tous les jours
                  displayEvent = true;
                  break;
                case 2: // Toutes les semaines
                  const differenceInDays = Math.floor(
                    (currentDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  displayEvent = differenceInDays % 7 === 0;
                  break;
                case 3: // Tous les mois
                  displayEvent = eventStartDate === jour;
                  break;
                case 4: // Tous les ans
                  if (eventStartMonth === mois && eventStartDate === jour) {
                    displayEvent = true;
                  } else if (
                    eventStartMonth === 2 &&
                    eventStartDate === 29 &&
                    mois === 3 &&
                    jour === 1 &&
                    !isLeapYear(annee)
                  ) {
                    // Gestion spécifique du 29 février dans une année non bissextile
                    displayEvent = true;
                  }
                  break;
                case 5: // Custom
                default:
                  break;
              }
            }

            // Éviter d'afficher l'événement deux fois s'il tombe sur sa date de départ
            if (eventStartDate === jour && eventStartMonth === mois && eventStartYear === annee) {
              displayEvent = false;
            }

            if (displayEvent) {
              // Calculons la nouvelle date de début
              const adjustedEventStart = new Date(Date.UTC(annee, mois - 1, jour));

              // On clone l'évènement en ajustant la date de début et de fin
              const adjustedEvent = {
                ...evt,
                start: adjustedEventStart.toISOString(),
                end: new Date(adjustedEventStart.getTime() + dureeEvent).toISOString()
              };

              adjustedRecurringEvents.push(adjustedEvent);
            }
          }

          // Passer au jour suivant
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(events, adjustedRecurringEvents);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
