import EntityStructures from "../../structures/EntityStructure.js";

/**
 * Représente une structure d'un événement
 * @extends {EntityStructures} Les structures d'entité
 */
export default class Event extends EntityStructures {
  /**
   * Crée une structure d'un événement
   * @param {Entity} [entity] L'entité de l'événement
   * @param {Object} [data] Les données de l'événement
   * @constructor
   */
  constructor(entity, data) {
    super(entity, data);

    /**
     * L'identifiant de l'événement
     * @type {int}
     */
    this.eventId = data.eventId;

    /**
     * L'identifiant de l'agenda
     * @type {int}
     */
    this.agendaId = data.agendaId;

    /**
     * Le nom de l'événement
     * @type {string}
     */
    this.name = data.name;

    /**
     * La description de l'événement
     * @type {string}
     */
    this.description = data.description;

    /**
     * La date de début de l'événement
     * @type {Date}
     */
    this.startDate = new Date(data.startDate);

    /**
     * La date de fin de l'événement
     * @type {Date}
     */
    this.endDate = new Date(data.endDate);

    /**
     * Booléen pour savoir si l'événement est sur toute la journée
     * @type {Boolean}
     */
    this.allDay = data.allDay;
  }

  /**
   * Récupère les agendas
   * @returns {Object} Les agendas
   */
  get agendas() {
    return this.entity.server.database.tables.get("agendas");
  }

  /**
   * Met à jour les données de l'événement
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<Event>} Une promesse de l'événement
   */
  async update(data) {
    return this.entity.update((x) => x.eventId === this.eventId, data);
  }

  /**
   * Supprime l'événement
   * @returns {Promise<void>}
   */
  async delete() {
    return this.entity.delete((x) => x.eventId === this.eventId);
  }

  /**
   * Retourne l'agenda de l'événement
   * @returns {Agenda} L'agenda
   */
  getAgenda() {
    return this.agendas.get(this.agendaId);
  }

  /**
   * Retourne le propriétaire de l'agenda
   * @returns {User} L'utilisateur
   */
  getOwner() {
    return this.getAgenda().getOwner();
  }

  /**
   * Retourne les données de l'événement
   * @returns {Object} Les données de l'événement
   */
  toJSON() {
    return {
      eventId: this.eventId,
      agendaId: this.agendaId,
      name: this.name,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      allDay: this.allDay
    };
  }
}
