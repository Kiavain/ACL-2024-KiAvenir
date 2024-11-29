import EntityStructure from "../../structures/EntityStructure.js";

/**
 * Représente une structure d'une occurrence d'événement
 * @extends {EntityStructure}
 */
export default class EventOccurrence extends EntityStructure {
  /**
   * Crée une structure d'une occurrence d'événement
   * @param {Entity} [entity] L'entité de l'occurrence d'événement
   * @param {Object} [data] Les données de l'occurrence
   * @constructor
   */
  constructor(entity, data) {
    super(entity, data);

    /**
     * L'identifiant de l'occurrence
     * @type {int}
     */
    this.occurrenceId = data.occurrenceId;

    /**
     * L'identifiant de l'événement parent
     * @type {int}
     */
    this.eventId = data.eventId;

    /**
     * La date de début de l'événement
     * @type {Date}
     */
    this.occurrenceStart = new Date(data.occurrenceStart);

    /**
     * La date de fin de l'événement
     * @type {Date}
     */
    this.occurrenceEnd = new Date(data.occurrenceEnd);

    /**
     * Le nom spécifique de l'occurrence (si modifié)
     * @type {string}
     */
    this.name = data.name;

    /**
     * La description spécifique de l'occurrence (si modifiée)
     * @type {string}
     */
    this.description = data.description;

    /**
     * Booléen pour savoir si l'occurence est sur toute la journée
     * @type {Boolean}
     */
    this.allDay = data.allDay;

    /**
     * Booléen pour savoir si l'occurrence est annulée
     * @type {Boolean}
     */
    this.isCancelled = data.isCancelled || false;
  }

  /**
   * Met à jour les données de l'occurrence
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<EventOccurrence>} Une promesse de l'occurrence
   */
  async update(data) {
    return this.entity.update((x) => x.occurrenceId === this.occurrenceId, data);
  }

  /**
   * Supprime l'occurrence
   * @returns {Promise<void>}
   */
  async delete() {
    return this.entity.delete((x) => x.occurrenceId === this.occurrenceId);
  }

  /**
   * Retourne les données de l'occurrence
   * @returns {Object} Les données de l'occurrence
   */
  toJSON() {
    return {
      occurrenceId: this.occurrenceId,
      eventId: this.eventId,
      occurrenceStart: this.occurrenceStart,
      occurrenceEnd: this.occurrenceEnd,
      name: this.name,
      description: this.description,
      isCancelled: this.isCancelled
    };
  }
}
