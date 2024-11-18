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
        const recurringEvents = events.filter(event => event.recurrence != 0);
        let adjustedRecurringEvents = [];

        // Notes:
          // start: debut du calendrier à afficher
          // end: fin du calendrier à afficher

          // Algorithme
          // Pour chaque jour, regarder les evenements recurrents
          // Si la date du jour est superieure a la date de l'evenement
          //  Calculer si l'evenement doit etre afficher ce jour
          //    - si quotidient: true
          //    - si hebdo: calculer la date modulo 7, si ca tombe juste, afficher l'event
          //    - si mensuel: true si le jour en question est le meme jour que l'evt
          //    - si annuel: true si le jour et le mois en question est le meme que l'evt (exception: si l'evt est un 29 fevrier et pas de 29/02 cette annee: mettre le 1er mars)
          //   Pour calculer la date de fin de l'event cloné, calculer la duree de l'event (date de fin - date de debut), et calculer la nouvelle date de fin à partir de la nouvelle date de début
          //   Sauf si c'est un 'all-day' ?


          const startCalendar = new Date(start);
          let currentDate = new Date(start);
          const endCalendar = new Date(end);

          // S'assurer que startCalendar est avant endCalendar
          if (startCalendar > endCalendar) {
              console.log("La date de début du calendrier est après la date de fin");
              return;
          }

          // Parcourir les jours du calendrier affiché (entre startCalendar et endCalendar)
          while (currentDate < endCalendar) {
              // Afficher le jour en question
              const dateComplete = currentDate.toLocaleString().split('T')[0];
              // console.log(dateComplete); // Affiche le jour au format DD/MM/YYYY
              const dateSeparee = dateComplete.split('/');
              
              const jour = dateSeparee[0];
              const mois = dateSeparee[1];
              const annee = dateSeparee[2].split(' ')[0];
              // console.log(jour, mois, annee);



              // Passer au jour suivant
              currentDate.setDate(currentDate.getDate() + 1);
          }



        // for (const evt of recurringEvents) {
        //   const startDate = new Date(evt.start);
        //   const endDate = new Date(evt.end);
          
        //   // Clone l'évènement
        //   let adjustedEvent = { ...evt };
        //   // adjustedEvent.eventId = 0;

        //   console.log("On duplique l'event " + evt.eventId + " - '" + evt.title + "' (date: " + evt.start + ", recurrence:" + evt.recurrence + ")");
        //   switch (evt.recurrence) {
        //     case 1: // Tous les jours
        //       startDate.setDate(startDate.getDate() + 1);
        //       endDate.setDate(endDate.getDate() + 1);
        //       break;
        //     case 2: // Toutes les semaines
        //       startDate.setDate(startDate.getDate() + 7);
        //       endDate.setDate(endDate.getDate() + 7);
        //       break;
        //     case 3: // Tous les mois
        //       if (startCalendar.getMonth() > startDate.getMonth()) {
        //         console.log("Mois actuel: " + startCalendar.getMonth());
        //         startDate.setMonth(startCalendar.getMonth());
        //         endDate.setMonth(startCalendar.getMonth());
        //       }
        //       break;
        //     case 4: // Tous les ans
        //       if (start < startDate) {
        //         startDate.setFullYear(start.getFullYear());
        //         endDate.setFullYear(start.getFullYear());
        //       }
        //       break;
        //     default:
        //       break;
        //   }
        //   adjustedEvent.start = startDate.toISOString();
        //   adjustedEvent.end = endDate.toISOString();

        //   console.log("> (date: " + evt.start + ", recurrence:" + evt.recurrence + ")");
        //   adjustedRecurringEvents.push(adjustedEvent);
        // }

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

        // console.log(start);
        // console.log(startCalendar.toLocaleString());
        

        // Pour obtenir les jours en UTC (sans le +1h de la timezone)
        // const day2 = startCalendar.getUTCDate(); // Jour du mois en UTC
        // const month2 = startCalendar.getUTCMonth() + 1; // Mois en UTC (ajoute 1 car getUTCMonth() retourne un index de 0 à 11)
        // const year2 = startCalendar.getUTCFullYear(); // Année en UTC
        // console.log(day2, month2, year2);

        // console.log(adjustedRecurringEvents);

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(events, adjustedRecurringEvents);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
