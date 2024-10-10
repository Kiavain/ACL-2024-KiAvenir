import EntityStructures from "../../structures/EntityStructures.js";

/**
 * Representation of a user
 * @extends {EntityStructures}
 */
export default class User extends EntityStructures {
  /**
   * @param {Entity} [entity] The instantiating client
   * @param {Object} [data] The data for a user
   */
  constructor(entity, data) {
    super(entity, data);

    /**
     * The identifier of the user
     * @type {String}
     */
    this.id = data.id;

    /**
     * The language of the user
     * @type {String}
     */
    this.lang = data.lang;

    /**
     * The money of the user
     * @type {Number}
     */
    this.money = data.money;

    /**
     * The date when the user is created
     * @type {Date}
     */
    this.createdAt = new Date(data.createdAt);

    /**
     * The date when the user is updated
     * @type {Date}
     */
    this.updatedAt = new Date(data.updatedAt);
  }

  /**
   * Update user data
   * @param data {Object}
   * @returns {*}
   */
  async update(data) {
    return this.entity.update((x) => x.id === this.id, data);
  }

  /**
   * Delete user data
   * @returns {*}
   */
  async delete() {
    return this.entity.delete((x) => x.id === this.id);
  }
}
