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
              // je désactive pour récupérer TOUS les évènements et afficher les récurrents
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
        const recurringEvents = events.filter((event) => event.recurrence !== 0);
        let adjustedRecurringEvents = [];

        // Algorithme
        // Pour chaque jour, regarder les evenements recurrents
        // Si la date du jour est superieure a la date de l'evenement:
        //  Calculer si l'evenement doit etre afficher ce jour
        //    - si quotidien: true
        //    - si hebdo: calculer la date modulo 7, si ca tombe juste, true
        //    - si mensuel: true si le jour est le meme jour que l'event
        //    - si annuel: true si le jour et le mois sont les memes que l'event
        //      (exception: si l'event est un 29 fevrier et qu'il n'y en a pas cette annee: mettre le 1er mars)
        //
        //   Pour calculer la date de fin de l'event cloné, calculer la duree de l'event (date de fin - date de debut),
        //    et calculer la nouvelle date de fin à partir de la nouvelle date de début
        //   Sauf si c'est un 'all-day' ?

        let currentDate = new Date(start);
        const endCalendar = new Date(end);

        // Parcourir les jours du calendrier affiché (entre startCalendar et endCalendar)
        while (currentDate < endCalendar) {
          // Afficher le jour en question
          const dateToString = currentDate.toLocaleString().split("T")[0].split("/");

          const jour = parseInt(dateToString[0]);
          const mois = parseInt(dateToString[1]);
          const annee = parseInt(dateToString[2].split(" ")[0]);

          console.log("\nJour traité: " + jour + "-" + mois + "-" + annee);

          // On parcourt les évènements récurrents pour savoir si on doit en afficher un
          for (const evt of recurringEvents) {
            let displayEvent = false;
            const eventStart = new Date(evt.start);
            const eventEnd = new Date(evt.end);
            const dureeEvent = eventEnd - eventStart; // On calcule la duree de l'évènement

            const eventStartDate = eventStart.getDate();
            const eventStartMonth = eventStart.getMonth() + 1;
            const eventStartYear = eventStart.getFullYear();

            // On vérifie si l'évènement doit être affiché
            // if tombe un bon jour, alors displayEvent = true;
            if (currentDate > eventStart) {
              // Si la date du jour en question est ultérieure à la date originale de l'évènement
              switch (evt.recurrence) {
                case 1: // Tous les jours
                  // console.log("Tous les jours", evt.title);
                  displayEvent = true;
                  break;
                case 2: // Toutes les semaines
                  // On calcule si la date de début est la même modulo 7 jours
                  // On convertit les dates en "jours calendaires" (pour pallier aux changements d'heures)
                  let currentDateMidnight = new Date(currentDate);
                  let eventStartMidnight = new Date(eventStart);
                  currentDateMidnight.setHours(0, 0, 0, 0);
                  eventStartMidnight.setHours(0, 0, 0, 0);

                  const daysFromEvent = Math.floor(new Date(eventStartMidnight).getTime() / (1000 * 60 * 60 * 24));
                  const daysFromCurrent = Math.floor(new Date(currentDateMidnight).getTime() / (1000 * 60 * 60 * 24));
                  // On calcule la différence de jours
                  const differenceInDays = Math.abs(daysFromEvent - daysFromCurrent);
                  // On teste la différence modulo 7
                  displayEvent = differenceInDays % 7 === 0;
                  if (displayEvent) {
                    console.log(currentDateMidnight, eventStartMidnight, differenceInDays % 7, displayEvent);
                  }
                  break;
                case 3: // Tous les mois
                  if (eventStartDate == jour) {
                    displayEvent = true;
                  }
                  break;
                case 4: // Tous les ans
                  if (eventStartMonth == mois && eventStartDate == jour) {
                    //todo fix: prendre en compte les 29 fevrier comme des 1er mars ?
                    displayEvent = true;
                  }
                  break;
                default:
                  break;
              }
            }

            // On vérifie qu'on soit pas à la date même de l'évènement avant (pour éviter de l'afficher 2 fois)
            if (eventStartDate == jour && eventStartMonth == mois && eventStartYear == annee) {
              displayEvent = false;
            }

            if (displayEvent) {
              // On clone l'évènement
              let adjustedEvent = { ...evt };

              // let adjustedEventStart = eventStart.toLocaleString();
              let adjustedEventStart = new Date(eventStart);
              adjustedEventStart.setYear(annee);
              adjustedEventStart.setMonth(mois - 1);
              adjustedEventStart.setDate(jour);

              // Calculons la date de fin
              let adjustedEventEnd = new Date(adjustedEventStart);
              adjustedEventEnd.setTime(adjustedEventStart.getTime() + dureeEvent); // On définit la date de fin de l'évènement

              adjustedEvent.start = adjustedEventStart.toISOString();
              adjustedEvent.end = adjustedEventEnd.toISOString();

              console.log(adjustedEventStart , adjustedEvent.start);

              adjustedRecurringEvents.push(adjustedEvent);
            }
          }

          // Passer au jour suivant
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(events, adjustedRecurringEvents);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      // console.log("events", allEvents);
      res.json(allEvents);
    });
  }
}
