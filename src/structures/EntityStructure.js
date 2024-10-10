/**
 * La structure d'une entité
 */
export default class EntityStructure {
  /**
   * Construit la structure d'une entité
   * @param entity {Entity} L'entité
   * @param data {Object} Les données
   * @constructor
   */
  constructor(entity, data) {
    /**
     * L'entité
     * @type {Entity}
     */
    this.entity = entity;

    /**
     * Les données
     * @type {Object}
     */
    this.data = data;
  }

  /**
   * Met à jour les données de l'entité
   * @param data {Object} Les données à mettre à jour
   * @return {EntityStructure} La structure de l'entité
   */
  patch(data) {
    this.data = data;
    return this;
  }
}
