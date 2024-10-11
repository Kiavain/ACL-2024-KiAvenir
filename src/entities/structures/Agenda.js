import EntityStructure from "../../structures/EntityStructure.js";

/**
 * Représente une structure d'agenda
 * @extends {EntityStructure} Les structures d'entité
 */
export default class Agenda extends EntityStructure {
  /**
   * Crée une structure d'agenda
   * @param {Entity} [entity] L'entité de l'agenda
   * @param {Object} [data] Les données de l'agenda
   * @constructor
   */
  constructor(entity, data) {
    super(entity, data);

    /**
     * L'identifiant de l'agenda
     * @type {int}
     */
    this.agendaId = data.agendaId;

    /**
     * L'identifiant du propriétaire de l'agenda
     * @type {int}
     */
    this.ownerId = data.ownerId;

    /**
     * Le nom de l'agenda
     * @type {string}
     */
    this.name = data.name;

    /**
     * La couleur de l'agenda
     * @type {string}
     */
    this.color = data.color;
  }

  /**
   * Met à jour les données de l'agenda
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<Agenda>} Une promesse de l'agenda
   */
  async update(data) {
    return this.entity.update((x) => x.id === this.id, data);
  }

  /**
   * Supprime l'agenda
   * @returns {Promise<void>} Une promesse
   */
  async delete() {
    return this.entity.delete((x) => x.id === this.id);
  }
}
