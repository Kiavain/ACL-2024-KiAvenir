export default class EntityStructure {
  /**
   * Build the entity structure
   * @param entity {Entity} The entity
   * @param data {Object} The data to build the entity structure
   */
  constructor(entity, data) {
    /**
     * The entity
     * @type {Entity}
     */
    this.entity = entity;

    /**
     * The data
     * @type {Object}
     */
    this.data = data;
  }

  /**
   * Patch the entity structure
   * @param data {Object} The data to patch the entity structure
   * @return {EntityStructure} The patched entity structure
   */
  patch(data) {
    this.data = data;
    return this;
  }
}
