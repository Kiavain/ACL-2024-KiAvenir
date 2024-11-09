import Controller from "./Controller.js";
import path from "path";
import * as os from "node:os";
import * as fs from "node:fs";
import ical from "ical-generator";
import * as ICAL from "ical.js";

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
    this.renderAgendaId = this.renderAgendaId.bind(this);
    this.deleteAgenda = this.deleteAgenda.bind(this);
  }

  /**
   * Redirige vers l'agenda par défaut : le premier de la liste
   * @param req La requête
   * @param res La réponse
   * @returns {*}
   */
  renderAgenda(req, res) {
    if (!res.locals.user) {
      req.flash("Vous devez être connecté pour accéder à cette page.");
      return res.redirect("/login");
    }

    // Récupérer le premier agenda de la liste pour l'utilisateur courant
    const agenda = this.database.get("agendas").filter((agenda) => agenda.ownerId === res.locals.user.id);
    res.redirect("/agenda/" + agenda[0].agendaId);
  }

  /**
   * Rend la page de l'agenda
   * @param req La requête
   * @param res La réponse
   * @returns {Promise<*>}
   */
  async renderAgendaId(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      req.flash("Vous devez être connecté pour accéder à cette page.");
      return res.redirect("/login");
    }

    // Récupère les éléments nécessaires
    const agenda = this.agendas.get(req.params.agendaId);
    const guestsShared = this.guests.filter((guest) => guest.guestId === localUser.id);

    if (!agenda) {
      return res.status(404).redirect("/404");
    } else if (!agenda.verifyAgendaAccess(localUser.id)) {
      return res.status(403).redirect("/403");
    }
    res.render("agenda", { agenda, agendas: this.agendas, guests: this.guests, guestsShared });
  }

  /**
   * Crée un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  createAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const { name, description, color } = req.body;
    if (!name) {
      return res.err(400, "Le nom de l'agenda est requis.");
    }

    const alreadyExist = this.agendas.find((a) => a.name === name && a.ownerId === localUser.id);
    if (alreadyExist) {
      return res.err(400, "Un agenda avec le même nom existe déjà.");
    }

    this.agendas
      .create({ name, description, ownerId: localUser.id, color })
      .then((agenda) => res.success(`L'agenda ${agenda.name} a été créé avec succès.`, { agendaId: agenda.agendaId }))
      .catch((error) => res.err(500, error));
  }

  /**
   * Met à jour un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async updateAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const { name } = req.body;
    const agenda = this.agendas.get(req.params.agendaId);
    if (!agenda) {
      return res.err(404, "Agenda non trouvé.");
    } else if (!agenda.verifyCanEdit(localUser.id)) {
      return res.err(403, "Vous n'êtes pas autorisé à modifier cet agenda.");
    } else if (!name || name.trim() === "") {
      return res.err(400, "Le nom de l'agenda est requis.");
    }

    await agenda.update({ name });
    return res.success(`L'agenda ${agenda.name} a été mis à jour avec succès.`);
  }

  /**
   * Partage un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  shareAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const { mail, role } = req.body;
    const sharedUser = this.users.find((user) => user.email === mail);
    if (!sharedUser) {
      return res.err(400, "Utilisateur non trouvé.");
    }

    // Vérifie si le guest n'a pas déjà accès à l'agenda
    const agendaId = parseInt(req.params.agendaId);
    const agenda = this.agendas.get(agendaId);
    const alreadyShared = this.guests.find((g) => g.agendaId === agendaId && g.guestId === sharedUser.id);
    if (alreadyShared) {
      return res.err(400, "L'utilisateur a déjà accès à cet agenda.");
    } else if (!agenda) {
      return res.err(404, "Agenda non trouvé.");
    } else if (!mail || mail.trim() === "") {
      return res.err(400, "L'email de l'utilisateur est requis.");
    } else if (role !== "Lecteur" && role !== "Editeur") {
      return res.err(400, "Rôle inconnu.");
    } else if (agenda.ownerId !== localUser.id) {
      return res.err(403, "Vous n'êtes pas autorisé à partager cet agenda.");
    } else if (sharedUser.id === localUser.id) {
      return res.err(400, "Vous ne pouvez pas partager un agenda avec vous-même.");
    }

    this.guests
      .create({ agendaId, guestId: sharedUser.id, role })
      .then(() => res.success(`L'agenda ${agenda.name} a été partagé avec succès à ${sharedUser.username}.`))
      .catch((error) => res.err(500, error));
  }

  /**
   * Supprime un agenda
   * @param req La requête
   * @param res La réponse
   */
  deleteAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const agenda = this.agendas.get(req.params.agendaId);
    if (!agenda) {
      return res.err(404, "Agenda non trouvé.");
    } else if (agenda.ownerId !== localUser.id) {
      return res.err(403, "Vous n'êtes pas autorisé à supprimer cet agenda.");
    }

    const agendas = this.agendas.filter((agenda) => agenda.ownerId === localUser.id);
    if (agendas.length === 1) {
      return res.err(400, "Vous ne pouvez pas supprimer votre dernier agenda.");
    }

    agenda
      .delete()
      .then(() => res.success(`L'agenda ${agenda.name} a été supprimé avec succès.`))
      .catch((error) => res.err(500, error));
  }

  /**
   * Met à jour le rôle d'un Guest
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  updateGuest(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const { guestId, role } = req.body;
    const guest = this.guests.get(guestId);
    if (!guest) {
      return res.err(404, "Guest non trouvé.");
    } else if (guest.getOwner().id !== localUser.id) {
      return res.err(403, "Vous n'êtes pas autorisé à modifier ce guest.");
    } else if (role !== "Lecteur" && role !== "Editeur") {
      return res.err(400, "Rôle inconnu.");
    } else if (role === guest.role) {
      return res.err(400, "Le rôle est déjà défini à " + role);
    }

    const agendaTitle = guest.getAgenda().name;
    const guestUsername = guest.getGuest().username;
    guest
      .update({ role })
      .then(() => res.success(`Le rôle de ${guestUsername} dans ${agendaTitle} a été mis à jour avec succès.`))
      .catch((error) => res.err(500, error));
  }

  /**
   * Supprime un Guest
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  removeGuest(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const { guestId } = req.body;
    const guest = this.guests.get(guestId);
    if (!guest) {
      return res.err(404, "Guest non trouvé.");
    } else if (guest.getOwner().id !== localUser.id) {
      return res.err(403, "Vous n'êtes pas autorisé à supprimer ce guest.");
    }

    const agendaTitle = guest.getAgenda().name;
    const guestUsername = guest.getGuest().username;
    guest
      .delete()
      .then(() => res.success(`Le partage de ${agendaTitle} à ${guestUsername} a été supprimé avec succès.`))
      .catch((error) => res.err(500, error));
  }

  /**
   * Récupère les invités pour un agenda
   * @param req La requête
   * @param res La réponse
   */
  getGuests(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }

    const agendaId = req.query.agendaId;
    if (!agendaId) {
      return res.err(400, "L'identifiant de l'agenda est requis.");
    }

    const agenda = this.agendas.get(agendaId);
    if (!agenda) {
      return res.err(404, "Agenda non trouvé.");
    } else if (!agenda.verifyAgendaAccess(localUser.id)) {
      return res.err(403, "Vous n'êtes pas autorisé à accéder à cet agenda.");
    }

    res.json(
      agenda.getGuests().map((guest) => ({
        id: guest.id,
        username: guest.getGuest().username,
        role: guest.role
      }))
    );
  }
  /**
   * Exporter un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  exportAgenda(req, res) {
    const localUser = res.locals.user;
    if (!localUser) {
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }
    const { format } = req.body;

    // Vérifie si le guest n'a pas déjà accès à l'agenda
    const agendaId = parseInt(req.params.agendaId);
    const agenda = this.agendas.get(agendaId);
    if (!agenda) {
      return res.err(404, "Agenda non trouvé.");
    }

    if (format === "JSON") {
      // Crée une copie de l'objet agenda simple
      const data = JSON.stringify({
        name: agenda.name,
        description: agenda.description,
        color: agenda.color,
        events: agenda.getEvents().map((event) => ({
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          description: event.description,
          allDay: event.allDay
        }))
      });
      const filename = `agenda_${agendaId}.json`;
      const downloadsPath = path.join(os.homedir(), "Downloads", filename);

      fs.writeFileSync(downloadsPath, data, "utf8");

      // eslint-disable-next-line no-unused-vars
      res.download(downloadsPath, filename, (err) => {});
    } else if (format === "ICS") {
      // Crée un calendrier ICAL avec les événements
      const calendar = ical({ name: agenda.name, description: agenda.description });
      agenda.getEvents().map((event) => {
        const eventConfig = {
          summary: event.name,
          description: event.description
        };

        if (event.allDay) {
          // Pour un événement "All day", on utilise uniquement les dates sans heures
          eventConfig.start = new Date(event.startDate).toISOString().split("T")[0]; // Format YYYY-MM-DD
          eventConfig.end = new Date(event.endDate).toISOString().split("T")[0]; // Format YYYY-MM-DD
          eventConfig.floating = true; // Indique qu'il n'y a pas d'heure spécifique
          eventConfig.allDay = true; // Spécifie explicitement que c'est un événement de journée entière
        } else {
          // Pour un événement normal, utiliser les dates avec heures
          eventConfig.start = event.startDate;
          eventConfig.end = event.endDate;
        }

        calendar.createEvent(eventConfig);
      });

      // Convertit le calendrier en chaîne ICAL
      const icsContent = calendar.toString();
      const filename = `agenda_${agendaId}.ics`;
      const downloadsPath = path.join(os.homedir(), "Downloads", filename);

      // Enregistre la chaîne ICS dans un fichier
      fs.writeFileSync(downloadsPath, icsContent, "utf8");

      // eslint-disable-next-line no-unused-vars
      res.download(downloadsPath, filename, (err) => {});
    } else {
      return res.err(400, "Format inconnu.");
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
      return res.err(401, "Vous devez être connecté pour accéder à cette page.");
    }
    // On vérifie si le fichier est présent
    const file = req.file;
    if (!file) {
      return res.err(401, "Vous devez importer un fichier valide.");
    }
    // On récupère l'extension du fichier
    const fileExtension = path.extname(file.originalname).toLowerCase();

    //Traite le fichier
    const fileContent = fs.readFileSync(file.path, "utf8");
    if (fileExtension === ".json") {
      //On traite l'import d'un agenda sous format json
      const data = JSON.parse(fileContent);
      const { name, color, events, description } = data;
      // On vérifie les champs de l'agenda
      if (!name || !color || !Array.isArray(events)) {
        return res.err(401, "Données de fichier JSON invalides.");
      }
      const alreadyExist = this.agendas.find((a) => a.name === name && a.ownerId === localUser.id);
      if (alreadyExist) {
        return res.err(401, "Vous possédez déjà un agenda avec le même nom.");
      }
      const agenda = await this.agendas.create({ name, description, ownerId: localUser.id, color });
      for (const event of events) {
        const {
          name: eventName,
          startDate: startDate,
          endDate: endDate,
          description: eventDescription,
          allDay: allDay
        } = event;
        // On vérifie les champs de chaque événement
        if (eventName && startDate && endDate && eventDescription) {
          await this.events.create({
            name: eventName,
            agendaId: agenda.agendaId,
            startDate: startDate,
            endDate: endDate,
            description: eventDescription,
            allDay: allDay
          });
        }
      }
    } else if (fileExtension === ".ics") {
      //On traite l'import d'un agenda sous format ics
      const parsedCalendar = ICAL.default.parse(fileContent);
      const comp = new ICAL.default.Component(parsedCalendar);
      const vevents = comp.getAllSubcomponents("vevent");
      const name = comp.getFirstPropertyValue("x-wr-calname");
      const color = "#0000FF";
      const summary = comp.getFirstPropertyValue("x-wr-caldesc");
      // On vérifie les champs de l'agenda
      if (!name || !Array.isArray(vevents)) {
        return res.err(401, "Données de fichier JSON invalides.");
      }
      const alreadyExist = this.agendas.find((a) => a.name === name && a.ownerId === localUser.id);
      if (alreadyExist) {
        return res.err(401, "Vous possédez déjà un agenda avec le même nom.");
      }
      const agenda = await this.agendas.create({ name, ownerId: localUser.id, color });

      for (const vevent of vevents) {
        const eventName = vevent.getFirstPropertyValue("summary");
        const dtstartProp = vevent.getFirstProperty("dtstart");
        const dtendProp = vevent.getFirstProperty("dtend");
        const startDate = new Date(dtstartProp.getFirstValue().toString());
        const endDate = dtendProp ? new Date(dtendProp.getFirstValue().toString()) : startDate;
        const eventDescription = vevent.getFirstPropertyValue("description") || "";

        const dtstartValue = dtstartProp.getFirstValue();
        const isAllDay = dtstartValue && typeof dtstartValue === "object" && dtstartValue.isDate === true;

        console.log(`Event: ${eventName}, isAllDay: ${isAllDay}, startDate: ${startDate}, endDate: ${endDate}`);

        if (eventName && startDate && endDate) {
          await this.events.create({
            name: eventName,
            agendaId: agenda.agendaId,
            startDate: startDate,
            endDate: endDate,
            description: eventDescription,
            allDay: isAllDay // Ajouter l'attribut allDay
          });
        }
      }
    } else {
      return res.err(401, "Format de fichier non supporté. Importez un fichier JSON ou ICS.");
    }
    res.success("L'agenda a été importé avec succès.");
  }
}
