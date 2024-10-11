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
  }

  /**
   * Met à jour les données de l'événement
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<Event>} Une promesse de l'événement
   */
  async update(data) {
    return this.entity.update((x) => x.id === this.id, data);
  }

  /**
   * Supprime l'événement
   * @returns {Promise<void>}
   */
  async delete() {
    return this.entity.delete((x) => x.id === this.id);
  }
}
