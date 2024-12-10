import Routeur from "../structures/Routeur.js";
import moment from "moment/moment.js";

/**
 * Les routes liées à la page d'accueil
 */
export default class HomepageRouteur extends Routeur {
  constructor(server) {
    super(server, null);
  }

  /**
   * Implémentation de la construction des routes
   */
  build() {
    this.router.get('/', (req, res) => {
      res.render('homepage');
    });

    this.router.get("/api/homepage/todayEvents", async (req, res) => {
      if (!res.locals.user) {
        return res.json([]);
      }

      // Synchronisation avec la base de données
      await this.server.database.sync();

      let allEvents = [];

      // Parcours chaque agendaId et récupère les événements correspondants
      const agendas = this.server.database.tables
        .get("agendas")
        .filter((agenda) => agenda.verifyAgendaAccess(res.locals.user.id));

      for (const agenda of agendas) {
        // Récupère les événements pour cet agenda spécifique
        const events = agenda
          .getEvents()
          .filter((e) => {
            return moment(e.startDate).isSame(new Date(), "day");
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
            agendaId: agenda.agendaId,
            owner: agenda.getOwner().username,
            canEdit: agenda.verifyCanEdit(parseInt(res.locals.user.id))
          }));

        // On récupère les évènements récurrents
        const recurringEvents = events.filter((event) => event.recurrence !== 0);
        let adjustedRecurringEvents = [];

        // Fonction pour vérifier si une année est bissextile
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

        // Parcourir les jours du calendrier affiché (entre startCalendar et endCalendar)
        let currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);
        const endCalendar = new Date();
        endCalendar.setUTCHours(23, 59, 59, 999);

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
              const adjustedEventStart = new Date(
                Date.UTC(annee, mois - 1, jour, eventStart.getUTCHours(), eventStart.getUTCMinutes())
              );

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
