import Controller from "./Controller.js";

export class AgendaController extends Controller {
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
      req.flash("notifications", "Vous devez être connecté pour accéder à cette page.");
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
      req.flash("notifications", "Vous devez être connecté pour accéder à cette page.");
      return res.redirect("/login");
    }

    // Récupère les tables de la base de données
    const agendas = this.database.get("agendas");
    const guests = this.database.get("guests");

    // Récupère les éléments nécessaires
    const agenda = agendas.get(req.params.agendaId);
    const guestsShared = guests.filter((guest) => guest.guestId === localUser.id);

    if (!agenda) {
      return res.status(404).redirect("/404");
    } else if (!agenda.verifyAgendaAccess(localUser.id)) {
      return res.status(403).redirect("/403");
    }
    res.render("agenda", { agenda, agendas, guests, guestsShared });
  }

  /**
   * Crée un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  createAgenda(req, res) {
    const userId = res.locals.user.id;
    const { name, description, color } = req.body;

    if (!name) {
      return res.render("agenda", {
        error: "Le nom de l'agenda est requis.",
        name: name,
        description: description,
        color: color
      });
    }

    const agendas = this.database.get("agendas").getAll();

    // Vérifie si un agenda avec le même nom existe déjà pour cet utilisateur
    const agendaAlreadyExists = agendas.find((agenda) => agenda.name === name && agenda.ownerId === userId);

    if (agendaAlreadyExists) {
      return res.json({
        success: false,
        message: "Un agenda avec ce nom existe déjà."
      });
    } else {
      const newAgenda = {
        name: name,
        description: description,
        ownerId: userId,
        color: color
      };

      this.database
        .get("agendas")
        .create(newAgenda)
        .then((agenda) => {
          res.json({
            success: true,
            message: "Agenda créé avec succès",
            agendaId: agenda.agendaId
          });
        })
        .catch((error) => res(500).json({ success: false, message: error }));
    }
  }

  /**
   * Met à jour un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async updateAgenda(req, res) {
    const userId = res.locals.user.id;
    const agendaId = req.params.agendaId;
    const { name } = req.body;
    const agenda = await this.database.get("agendas").get(agendaId);

    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: "Agenda non trouvé."
      });
    }
    if (agenda.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cet agenda."
      });
    }
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Le nom de l'agenda est requis."
      });
    }
    await agenda.update({ name });
    return res.status(200).json({ success: true, message: "Agenda mis à jour avec succès" });
  }

  /**
   * Partage un agenda
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async shareAgenda(req, res) {
    const userId = res.locals.user.id;
    const agendaId = req.params.agendaId;
    const { mail, role } = req.body;
    const agenda = await this.database.get("agendas").get(agendaId);
    const sharedUser = await this.database.get("users").find((user) => user.email === mail);
    const guests = this.database.get("guests").getAll();
    //Vérifie si l'email correpond à un utilisateur
    if (!sharedUser) {
      return res.status(400).json({
        success: false,
        message: "Utilisateur non trouvé."
      });
    }

    // Vérifie si le guest n'a pas déjà accès à l'agenda
    const alreadyShared = guests.find((guest) => guest.agendaId === agendaId && guest.guestId === sharedUser.id);

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: "L'agenda à déjà été partagé avec cet utilisateur."
      });
    }
    const newGuest = {
      agendaId: agendaId,
      guestId: sharedUser.id,
      role: role
    };

    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: "Agenda non trouvé."
      });
    }
    if (!mail || mail.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "L'email est requis."
      });
    }
    if (role !== "Lecteur" && role !== "Editeur") {
      return res.status(401).json({
        success: false,
        message: "Rôle inconnu."
      });
    }

    if (agenda.ownerId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Vous n'êtes pas autorisé à partager cet agenda."
      });
    }
    if (sharedUser.id === userId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez partager cet agenda à vous même."
      });
    }
    await this.database
      .get("guests")
      .create(newGuest)
      .then(() => {
        req.flash("notifications", "Agenda partagé avec succès à " + sharedUser.username);
        return res.status(200).json({ success: true, message: "Agenda partagé avec succès à " + sharedUser.username });
      })
      .catch((error) => res(500).json({ success: false, message: error }));
  }

  /**
   * Supprime un agenda
   * @param req La requête
   * @param res La réponse
   */
  deleteAgenda(req, res) {
    const userId = res.locals.user.id;
    const agendaId = req.params.agendaId;
    const agenda = this.database.get("agendas").get(agendaId);

    if (!agenda) {
      return res.status(404).json({
        success: false,
        message: "Agenda non trouvé."
      });
    }

    if (agenda.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer cet agenda."
      });
    }

    const agendas = this.database.get("agendas").filter((agenda) => agenda.ownerId === userId);
    if (agendas.length === 1) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre seul agenda."
      });
    }

    this.database.get("agendas").delete(agendaId);
    return res.status(200).json({ success: true, message: "Agenda supprimé avec succès" });
  }

  /**
   * Met à jour le rôle d'un Guest
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async updateGuest(req, res) {
    const { guestId, role } = req.body;
    const guest = await this.database.get("guests").get(guestId);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest non trouvé."
      });
    }
    if (role !== "Lecteur" && role !== "Editeur") {
      return res.status(401).json({
        success: false,
        message: "Rôle inconnu."
      });
    }
    if (role === guest.role) {
      return res.status(401).json({
        success: false,
        message: "Rôle identique."
      });
    }

    await guest.update({ role });
    return res.status(200).json({ success: true, message: "Guest mis à jour avec succès" });
  }
  /**
   * Supprime un Guest
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async removeGuest(req, res) {
    const { guestId } = req.body;
    const guest = await this.database.get("guests").get(guestId);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest non trouvé."
      });
    }
    await guest.delete();
    return res.status(200).json({ success: true, message: "Guest supprimé avec succès" });
  }

  /**
   * Récupère les invités pour un agenda
   * @param req La requête
   * @param res La réponse
   */
  getGuests(req, res) {
    const agendaId = parseInt(req.query.agendaId);

    // Filtrer les invités pour cet agenda (en utilisant ta base de données)
    const guests = this.database.get("guests").filter((guest) => guest.agendaId === agendaId);

    // Retourner les invités filtrés en JSON
    res.json(
      guests.map((guest) => ({
        id: guest.id,
        username: guest.getGuest().username,
        role: guest.role
      }))
    );
  }
}
