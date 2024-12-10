import Routeur from '../structures/Routeur.js';
import moment from 'moment/moment.js';

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

    this.router.get('/api/homepage/todayEvents', async (req, res) => {
      if (!res.locals.user) {
        return res.json([]);
      }

      // Synchronisation avec la base de données
      await this.server.database.sync();

      let allEvents = [];

      // Parcours chaque agendaId et récupère les événements correspondants
      const agendas = this.server.database.tables
        .get('agendas')
        .filter((agenda) => agenda.verifyAgendaAccess(res.locals.user.id));

      for (const agenda of agendas) {
        // Récupère les événements non récurrents
        const events = agenda.getEvents().filter((e) => {
          const isToday = moment(new Date()).isBetween(e.startDate, e.endDate, 'day', '[]');
          return agenda.agendaId === e.agendaId && isToday && e.recurrence === 4;
        });
        // Récupère les occurrences d'événements récurrents
        const recurringEvents = this.server.database.tables.get('event_occurrences').filter((o) => {
          const isToday = moment(new Date()).isBetween(o.occurrenceStart, o.occurrenceEnd, 'day');
          const parentEventInAgenda = agenda
            .getEvents()
            .map((e) => e.eventId)
            .includes(o.eventId);

          // Vérifie si l'ID de l'occurrence appartient à un événement valide
          return isToday && parentEventInAgenda && !o.isCancelled;
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
          interval: 1,
          unit: e.recurrence,
          agendaId: agenda.agendaId,
          canEdit: agenda.verifyCanEdit(parseInt(res.locals.user.id)),
          owner: res.locals.user.username
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
          recurrence: 5,
          owner: res.locals.user.username
        }));

        // Ajoute les événements de cet agenda au tableau global
        allEvents = allEvents.concat(formattedEvents, formattedOccurrences);
      }

      // Envoie tous les événements associés aux agendas spécifiés
      res.json(allEvents);
    });
  }
}
