import Controller from "./Controller.js";

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
    } else if (agenda.ownerId !== localUser.id) {
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
      return res.err(404, "Utilisateur non trouvé.");
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
}
