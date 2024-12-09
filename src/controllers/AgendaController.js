import Controller from './Controller.js';
import path from 'path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import ical from 'ical-generator';
import * as ICAL from 'ical.js';
import { fileURLToPath } from 'url';

/**
 * Typage des options des requêtes
 * @typedef {import("express").Request & {flash: (message: string) => void}} Request
 */

/**
 * Typage des options des réponses
 * @typedef {import("express").Response & {
 * success: (message: String, opt: Object = {}) => void,
 * err: (statusCode: int, message: String, opt: Object = {}) => void}
 * } Response
 */

/**
 * Type de données pour les entités
 * @typedef {import("../entities/structures/Agenda.js").default} Agenda
 * @typedef {import("../entities/structures/Guest.js").default} Guest
 * @typedef {import("../entities/structures/User.js").default} User
 * @typedef {import("../entities/structures/EventOccurrence.js.js").default} EventOccurrence
 */

/**
 * Type de données pour iCal
 * @typedef {import("ical-generator").ICalEvent | import("ical-generator").ICalEventData} ICalEvent
 */

/**
 * Contrôleur pour les actions liées aux agendas
 */
export class AgendaController extends Controller {
  /**
   * Constructeur du contrôleur
   * @param server Le serveur Express
   */
  constructor(server) {
    super(server);
    this.createAgenda = this.createAgenda.bind(this);
    this.updateAgenda = this.updateAgenda.bind(this);
    this.shareAgenda = this.shareAgenda.bind(this);
    this.exportAgenda = this.exportAgenda.bind(this);
    this.importAgenda = this.importAgenda.bind(this);
    this.updateGuest = this.updateGuest.bind(this);
    this.removeGuest = this.removeGuest.bind(this);
    this.getGuests = this.getGuests.bind(this);
    this.renderAgenda = this.renderAgenda.bind(this);
    this.deleteAgenda = this.deleteAgenda.bind(this);
    this.importHolidayAgenda = this.importHolidayAgenda.bind(this);
    this.deleteHolidayAgenda = this.deleteHolidayAgenda.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    this.acceptShare = this.acceptShare.bind(this);
  }

  /**
   * Récupère les notifications
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<{message: string, id: int}>}
   */
  getNotifications(req, res) {
    const user = res.locals.user;
    if (!user) {
      req.flash('Vous devez être connecté pour accéder à cette page.');
      return res.json([]);
    }

    // Récupère les notifications pour l'utilisateur
    const notifications = this.guests
      .filter((guest) => guest.guestId === user.id && guest.invited)
      .map((g) => {
        /**
         * L'invité
         * @type {Guest} guest
         */
        const guest = g;
        const agenda = guest.getAgenda();
        const owner = guest.getOwner();

        return { message: `${owner.username} veut partager '${agenda.name}' avec vous`, id: guest.id };
      });

    res.json(notifications);
  }

  /**
   * Redirige vers l'agenda par défaut : le premier de la liste
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  renderAgenda(req, res) {
    const user = res.locals.user;
    if (!user) {
      req.flash('Vous devez être connecté pour accéder à cette page.');
      return res.redirect('/login');
    }

    // Récupère les notifications
    const { notification } = req.cookies;
    if (notification) {
      req.flash(notification);
      res.clearCookie('notification');
    }

    // Récupère tous les agendas dont les IDs correspondent à ceux passés dans l'URL
    const agendas = this.agendas.filter((agenda) => agenda.verifyAgendaAccess(user.id));
    const guestsShared = this.guests.filter((guest) => guest.guestId === user.id);

    if (agendas.length > 0) {
      res.render('agenda', { agenda: agendas[0], agendas, guestsShared });
    } else {
      res.redirect('/404');
    }
  }

  /**
   * Crée un agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  createAgenda(req, res) {
    const user = res.locals.user;
    const { name, description, color } = req.body;

    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    } else if (!name) {
      return res.err(400, "Le nom de l'agenda est requis.");
    }

    this.agendas
      .create({ name, description, ownerId: user.id, color })
      .then((a) => {
        /**
         * L'agenda créé
         * @type {Agenda}
         */
        const agenda = a;
        res.cookie('notification', "L'agenda a été créé avec succès.", { maxAge: 5000 });
        res.success(`L'agenda ${agenda.name} a été créé avec succès.`, { agendaId: agenda.agendaId });
      })
      .catch((error) => res.err(500, error));
  }

  /**
   * Met à jour un agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  updateAgenda(req, res) {
    const user = res.locals.user;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }

    // Vérifie les champs de l'agenda
    const { name, color, description } = req.body;
    if (!agenda) {
      return res.err(404, 'Agenda non trouvé.');
    } else if (!name || name.trim() === '') {
      return res.err(400, "Le nom de l'agenda est requis.");
    } else if (color === '#FFFFFF') {
      return res.err(400, "La couleur de l'agenda ne peut pas être blanche.");
    } else if (description && description.length > 255) {
      return res.err(400, "La description de l'agenda ne peut pas dépasser 255 caractères.");
    }

    /**
     * L'agenda à mettre à jour
     * @type {Agenda}
     */
    const agenda = this.agendas.get(req.params.agendaId);
    if (!agenda.verifyCanEdit(user.id)) {
      return res.err(403, "Vous n'êtes pas autorisé à modifier cet agenda.");
    }

    agenda
      .update({ name, description, color })
      .then(() => {
        res.cookie('notification', "L'agenda a été mis à jour avec succès.", { maxAge: 5000 });
        res.success(`L'agenda ${agenda.name} a été mis à jour avec succès.`);
      })
      .catch((error) => res.err(500, error));
  }

  /**
   * Accepte un partage d'agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  acceptShare(req, res) {
    const user = res.locals.user;
    const { id } = req.params;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }

    /**
     * L'invité
     * @type {Guest}
     */
    const guest = this.guests.get(id);
    if (!guest) {
      return res.err(404, 'Guest non trouvé.');
    } else if (guest.guestId !== user.id) {
      return res.err(403, "Vous n'êtes pas autorisé à accepter ce partage.");
    }

    const agenda = guest.getAgenda();
    guest
      .update({ invited: false })
      .then(() => {
        res.cookie('notification', `Vous avez accepté le partage de l'agenda ${agenda.name}.`, { maxAge: 5000 });
        res.success(`Vous avez accepté le partage de l'agenda ${agenda.name}.`);
      })
      .catch((error) => res.err(500, error));
  }
  /**
   * Partage un agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  shareAgenda(req, res) {
    const user = res.locals.user;
    const { mail, role } = req.body;
    const agendaId = req.params.agendaId;

    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }

    /**
     * L'utilisateur partagé
     * @type {User}
     */
    const sharedUser = this.users.find((user) => user.email === mail);
    if (!sharedUser) {
      return res.err(400, 'Utilisateur non trouvé.');
    } else if (this.guests.find((g) => g.agendaId === agendaId && g.guestId === sharedUser.id)) {
      return res.err(400, "L'utilisateur a déjà accès à cet agenda.");
    }
    /**
     * L'agenda à partager
     * @type {Agenda}
     */
    const agenda = this.agendas.get(agendaId);

    if (!agenda) {
      return res.err(404, 'Agenda non trouvé.');
    } else if (!mail || mail.trim() === '') {
      return res.err(400, "L'email de l'utilisateur est requis.");
    } else if (role !== 'Lecteur' && role !== 'Editeur') {
      return res.err(400, 'Rôle inconnu.');
    } else if (agenda.ownerId !== user.id) {
      return res.err(403, "Vous n'êtes pas autorisé à partager cet agenda.");
    } else if (sharedUser.id === user.id) {
      return res.err(400, 'Vous ne pouvez pas partager un agenda avec vous-même.');
    }

    this.guests
      .create({ agendaId, guestId: sharedUser.id, role })
      .then(() => res.success(`L'agenda ${agenda.name} a été partagé avec succès à ${sharedUser.username}.`))
      .catch((error) => res.err(500, error));
  }

  /**
   * Supprime un agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  deleteAgenda(req, res) {
    const user = res.locals.user;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }

    /**
     * L'agenda à supprimer
     * @type {Agenda}
     */
    const agenda = this.agendas.get(req.params.agendaId);
    if (!agenda) {
      return res.err(404, 'Agenda non trouvé.');
    } else if (agenda.ownerId !== user.id) {
      return res.err(403, "Vous n'êtes pas autorisé à supprimer cet agenda.");
    } else if (!agenda.special && this.agendas.filter((a) => a.ownerId === user.id && !a.special).length === 1) {
      return res.err(400, 'Vous ne pouvez pas supprimer votre dernier agenda.');
    }

    agenda
      .delete()
      .then(() => {
        res.cookie('notification', "L'agenda a été supprimé avec succès.", { maxAge: 5000 });
        res.success(`L'agenda ${agenda.name} a été supprimé avec succès.`);
      })
      .catch((error) => res.err(500, error));
  }

  /**
   * Met à jour le rôle d'un Guest
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<*>}
   */
  async updateGuest(req, res) {
    const user = res.locals.user;
    const { guestId, role } = req.body;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    } else if (!['Propriétaire', 'Editeur', 'Lecteur'].includes(role)) {
      return res.err(400, 'Rôle inconnu.');
    }

    /**
     * L'invité
     * @type {Guest}
     */
    const guest = this.guests.get(guestId);
    if (!guest) {
      return res.err(404, 'Guest non trouvé.');
    } else if (guest.getOwner().id !== user.id) {
      return res.err(403, "Vous n'êtes pas autorisé à modifier ce guest.");
    } else if (role === guest.role) {
      return res.err(400, 'Le rôle est déjà défini à ' + role);
    } else if (role === 'Propriétaire' && guest.invited === true) {
      return res.err(400, `${guest.getGuest().username} doit accepter le partage avant de devenir propriétaire.`);
    }

    // Si le rôle est défini à Propriétaire, on met à jour le guest et on met à jour l'agenda
    let data = { role };
    if (role === 'Propriétaire') {
      await guest.getAgenda().update({ ownerId: guest.guestId });
      data = { guestId: user.id, role: 'Editeur' };
    }

    guest
      .update(data)
      .then(() => {
        res.cookie(
          'notification',
          `Le rôle de ${guest.getGuest().username} dans ${guest.getAgenda().name} a été mis à jour avec succès.`,
          { maxAge: 5000 }
        );
        res.success(
          `Le rôle de ${guest.getGuest().username} dans ${guest.getAgenda().name} a été mis à jour avec succès.`
        );
      })
      .catch((error) => res.err(500, error));
  }

  /**
   * Supprime un Guest
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  removeGuest(req, res) {
    const user = res.locals.user;
    const { guestId, desabonnement } = req.body;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }

    /**
     * Le guest à supprimer
     * @type {Guest}
     */
    const guest = this.guests.get(guestId);
    if (!guest) {
      return res.err(404, 'Guest non trouvé.');
    } else if (guest.getOwner().id !== user.id && !desabonnement) {
      return res.err(403, "Vous n'êtes pas autorisé à supprimer ce guest.");
    } else if (guest.getOwner().id === user.id && desabonnement) {
      return res.err(403, "Vous n'êtes pas autorisé à vous désabonner de votre propre agenda.");
    }

    guest
      .delete()
      .then(() => {
        res.cookie('notification', 'Le partage a été supprimé avec succès.', { maxAge: 5000 });
        res.success(
          `Le partage de ${guest.getAgenda().name} à ${guest.getGuest().username} a été supprimé avec succès.`
        );
      })
      .catch((error) => res.err(500, error));
  }

  /**
   * Récupère les invités pour un agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  getGuests(req, res) {
    const user = res.locals.user;
    const agendaId = req.query.agendaId;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    } else if (!agendaId) {
      return res.err(400, "L'identifiant de l'agenda est requis.");
    }

    /**
     * L'agenda
     * @type {Agenda}
     */
    const agenda = this.agendas.get(agendaId);
    if (!agenda) {
      return res.err(404, 'Agenda non trouvé.');
    } else if (!agenda.verifyAgendaAccess(user.id)) {
      return res.err(403, "Vous n'êtes pas autorisé à accéder à cet agenda.");
    }

    res.json(
      agenda.getGuests().map((guest) => ({
        id: guest.id,
        guestId: guest.guestId,
        username: guest.getGuest().username,
        role: guest.role,
        invited: guest.invited
      }))
    );
  }

  /**
   * Exporte les événements d'un calendrier en JSON
   * @param res {Response} La réponse
   * @param agenda {Agenda} L'agenda
   */
  exportJSON(res, agenda) {
    // Crée une copie de l'objet agenda simple
    const data = JSON.stringify({
      name: agenda.name,
      description: agenda.description,
      color: agenda.color,
      events: agenda.getEvents().map((event) => ({
        eventId: event.eventId,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description,
        allDay: event.allDay,
        recurrence: event.recurrence
      })),
      occurrences: this.eventOccurrences
        .filter((occurrence) => occurrence.getAgenda().agendaId === agenda.agendaId)
        .map((o) => {
          /**
           * L'occurrence
           * @type {EventOccurrence}
           */
          const occurrence = o;
          return {
            eventId: occurrence.eventId,
            name: occurrence.name,
            startDate: occurrence.occurrenceStart,
            endDate: occurrence.occurrenceEnd,
            description: occurrence.description,
            allDay: occurrence.allDay,
            unit: occurrence.unit,
            interval: occurrence.interval
          };
        })
    });

    // Enregistre les données dans un fichier JSON
    const filename = `agenda_${agenda.name}.json`;
    let downloadsPath = path.join(os.homedir(), 'Downloads', filename);
    if (!fs.existsSync(downloadsPath)) {
      downloadsPath = path.join(os.homedir(), 'Téléchargements', filename);
    }

    fs.writeFileSync(downloadsPath, data, 'utf8');
    res.download(downloadsPath, filename, () => {});
  }

  /**
   * Exporter un agenda
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   */
  exportAgenda(req, res) {
    const user = res.locals.user;
    const { format } = req.body;
    const agendaId = req.params.agendaId;
    if (!user) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }

    /**
     * L'agenda
     * @type {Agenda}
     */
    const agenda = this.agendas.get(agendaId);
    if (!agenda) {
      return res.err(404, 'Agenda non trouvé.');
    }

    if (format === 'JSON') {
      this.exportJSON(res, agenda);
    } else if (format === 'ICS') {
      // Crée un calendrier ICAL avec les événements
      const calendar = ical({ name: agenda.name, description: agenda.description });
      agenda.getEvents().map((event) => {
        /**
         * L'événement
         * @type {ICalEvent}
         */
        let eventConfig = {
          summary: event.name,
          description: event.description
        };

        if (event.allDay) {
          eventConfig.start = new Date(event.startDate).toISOString().split('T')[0];
          eventConfig.end = new Date(event.endDate).toISOString().split('T')[0];
          eventConfig.floating = true; // Indique qu'il n'y a pas d'heure spécifique
          eventConfig.allDay = true;
        } else {
          eventConfig.start = event.startDate;
          eventConfig.end = event.endDate;
        }

        calendar.createEvent(eventConfig);
      });

      // Convertit le calendrier en chaîne ICAL
      const icsContent = calendar.toString();
      const filename = `agenda_${agenda.name}.ics`;
      let downloadsPath = path.join(os.homedir(), 'Downloads', filename);
      if (!fs.existsSync(downloadsPath)) {
        downloadsPath = path.join(os.homedir(), 'Téléchargements', filename);
      }

      // Enregistre la chaîne ICS dans un fichier
      fs.writeFileSync(downloadsPath, icsContent, 'utf8');

      res.download(downloadsPath, filename, () => {});
    } else {
      return res.err(400, 'Format inconnu.');
    }
    res.success(`L'agenda ${agenda.name} a été exporté avec succès au format ${format}.`);
  }

  /**
   * Importer un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async importAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }
    // On vérifie si le fichier est présent
    const file = req.file;
    if (!file) {
      return res.err(401, 'Vous devez importer un fichier valide.');
    }
    // On récupère l'extension du fichier
    const fileExtension = path.extname(file.originalname).toLowerCase();

    //Traite le fichier
    const fileContent = fs.readFileSync(file.path, 'utf8');
    //Nombre d'evenements importés
    let countEvents = 0;
    let maxCountEvents = 0;
    if (fileExtension === '.json') {
      //On traite l'import d'un agenda sous format json
      const data = JSON.parse(fileContent);
      const { name, color, events, occurrences, description } = data;
      // On vérifie les champs de l'agenda
      if (!name || !color || !Array.isArray(events)) {
        return res.err(401, 'Données de fichier JSON invalides.');
      }

      const agenda = await this.agendas.create({ name, description, ownerId: localUser.id, color });
      maxCountEvents = events.length;
      for (const event of events) {
        const {
          name: eventName,
          startDate: startDate,
          endDate: endDate,
          description: eventDescription,
          allDay: allDay,
          recurrence
        } = event;
        // On vérifie les champs de chaque événement
        if (eventName && startDate && endDate && eventDescription) {
          const newEvent = await this.events.create({
            name: eventName,
            agendaId: agenda.agendaId,
            startDate: startDate,
            endDate: endDate,
            description: eventDescription,
            recurrence: recurrence,
            allDay: allDay
          });

          for (const occurrence of occurrences.filter((o) => o.eventId === event.eventId)) {
            await this.eventOccurrences.create({
              eventId: newEvent.eventId,
              name: occurrence.name,
              occurrenceStart: occurrence.startDate,
              occurrenceEnd: occurrence.endDate,
              description: occurrence.description,
              allDay: occurrence.allDay,
              unit: occurrence.unit,
              interval: occurrence.interval
            });
          }
          countEvents++;
        }
      }
    } else if (fileExtension === '.ics') {
      //On traite l'import d'un agenda sous format ics
      let parsedCalendar;
      try {
        parsedCalendar = ICAL.default.parse(fileContent);
      } catch (error) {
        return res.err(401, 'Données de fichier ICAL invalides.');
      }

      const comp = new ICAL.default.Component(parsedCalendar);
      const vevents = comp.getAllSubcomponents('vevent');
      const name = comp.getFirstPropertyValue('x-wr-calname');
      const color = '#0000FF';
      const summary = comp.getFirstPropertyValue('x-wr-caldesc');
      // On vérifie les champs de l'agenda
      if (!name || !Array.isArray(vevents)) {
        return res.err(401, 'Données de fichier ICAL invalides.');
      }
      const alreadyExist = this.agendas.find((a) => a.name === name && a.ownerId === localUser.id);
      if (alreadyExist) {
        return res.err(401, 'Vous possédez déjà un agenda avec le même nom.');
      }
      const agenda = await this.agendas.create({ name, description: summary, ownerId: localUser.id, color });
      countEvents = await this.importEvents(vevents, agenda.agendaId, countEvents);
      maxCountEvents = vevents.length;
    } else {
      return res.err(401, 'Format de fichier non supporté. Importez un fichier JSON ou ICS.');
    }

    res.cookie(
      'notification',
      "L'agenda a été importé avec succès. " + countEvents + ' événements importés sur ' + maxCountEvents + '.',
      {
        maxAge: 5000
      }
    );
    res.success("L'agenda a été importé avec succès.");
  }
  /**
   * Importer un agenda de vacances
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async importHolidayAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }
    const { lien } = req.body;
    if (!lien) {
      return res.err(401, 'Lien invalide.');
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, lien);
    if (!filePath) {
      return res.err(401, 'Lien invalide, agenda inconnu.');
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');

    //Traite le fichier
    const parsedCalendar = ICAL.default.parse(fileContent);
    const comp = new ICAL.default.Component(parsedCalendar);
    const vevents = comp.getAllSubcomponents('vevent');
    const name = comp.getFirstPropertyValue('x-wr-calname');
    const color = '#0000FF';
    const summary = comp.getFirstPropertyValue('x-wr-caldesc');
    const alreadyExist = this.agendas.find((a) => a.name === name && a.ownerId === localUser.id);
    if (alreadyExist) {
      return res.err(401, 'Vous possédez déjà un agenda avec le même nom.');
    }
    const agenda = await this.agendas.create({
      name,
      description: summary,
      ownerId: localUser.id,
      color,
      special: true
    });

    for (const vevent of vevents) {
      const eventName = vevent.getFirstPropertyValue('summary');
      const dtstartProp = vevent.getFirstProperty('dtstart');
      const dtendProp = vevent.getFirstProperty('dtend');
      const startDate = new Date(dtstartProp.getFirstValue().toString());
      const endDate = dtendProp ? new Date(dtendProp.getFirstValue().toString()) : startDate;
      const eventDescription = vevent.getFirstPropertyValue('description') || '';

      const dtstartValue = dtstartProp.getFirstValue();
      const isAllDay = dtstartValue && typeof dtstartValue === 'object' && dtstartValue.isDate === true;

      if (eventName && startDate && endDate) {
        await this.events.create({
          name: eventName,
          agendaId: agenda.agendaId,
          startDate: startDate,
          endDate: endDate,
          description: eventDescription,
          allDay: isAllDay
        });
      }
    }
    return res.json({
      success: true,
      flashMessages: ['Agenda ' + name + ' ajouté avec succès !'],
      newAgenda: {
        agendaId: agenda.agendaId,
        name: agenda.name,
        color: agenda.color
      }
    });
  }
  /**
   * Supprime un agenda de vacances
   * @param req La requête
   * @param res La réponse
   */
  deleteHolidayAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, 'Vous devez être connecté pour accéder à cette page.');
    }
    const { name } = req.body;
    if (!name) {
      return res.err(401, 'Nom invalide.');
    }

    const agenda = this.agendas.find((a) => a.name === name && a.ownerId === localUser.id);
    if (!agenda) {
      return res.err(404, 'Agenda non trouvé.');
    } else if (agenda.ownerId !== localUser.id) {
      return res.err(403, "Vous n'êtes pas autorisé à supprimer cet agenda.");
    }

    const agendas = this.agendas.filter((agenda) => agenda.ownerId === localUser.id);
    if (agendas.length === 1) {
      return res.err(400, 'Vous ne pouvez pas supprimer votre dernier agenda.');
    }

    agenda
      .delete()
      .then(() => res.success(`L'agenda ${agenda.name} a été supprimé avec succès.`))
      .catch((error) => res.err(500, error));
  }
}
