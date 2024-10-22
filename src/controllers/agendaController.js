import Controller from "./controller.js";

export class AgendaController extends Controller {
  constructor(server) {
    super(server);
    this.createAgenda = this.createAgenda.bind(this);
    this.updateAgenda = this.updateAgenda.bind(this);
    this.shareAgenda = this.shareAgenda.bind(this);
    this.updateGuest = this.updateGuest.bind(this);
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
    const alreadyShared = guests.find((guest) => guest.agendaId === agendaId || guest.guestId === sharedUser.id);

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
   * Met à jour le rôle d'un Guest
   * @param req
   * @param res
   * @returns {Promise<*>}
   */
  async updateGuest(req, res) {
    console.log("Updating");
    const guestId = req.params.guestId;
    const { newRole } = req.body;
    const guest = await this.database.get("guest").get(guestId);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest non trouvé."
      });
    }
    if (newRole !== "Lecteur" && newRole !== "Editeur") {
      return res.status(401).json({
        success: false,
        message: "Rôle inconnu."
      });
    }
    if (newRole === guest.role) {
      return res.status(401).json({
        success: false,
        message: "Rôle identique."
      });
    }

    await guest.update({ newRole });
    return res.status(200).json({ success: true, message: "Guest mis à jour avec succès" });
  }
}
