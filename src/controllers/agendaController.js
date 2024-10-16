import Controller from "./controller.js";

export class AgendaController extends Controller {
  constructor(server) {
    super(server);
    this.createAgenda = this.createAgenda.bind(this);
    this.updateAgenda = this.updateAgenda.bind(this);
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
    console.log("createAgenda userId:", userId);

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
      const createdAt = Date.now();
      const updatedAt = createdAt;
      const newAgenda = {
        name: name,
        description: description,
        ownerId: userId,
        color: color,
        createdAt: createdAt,
        updatedAt: updatedAt
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
    console.log("updateAgenda agenda owner:" + agenda.ownerId);
    console.log("updateAgenda user:" + userId);

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

    const updatedAt = Date.now();
    await agenda.update({ name, updatedAt });
    return res.status(200).json({ success: true, message: "Agenda mis à jour avec succès" });
  }
}
