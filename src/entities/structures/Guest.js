import EntityStructure from '../../structures/EntityStructure.js';

/**
 * Type de données pour les entités
 * @typedef {import("../AgendasEntity.js").default} AgendasEntity
 * @typedef {import("../UsersEntity.js").default} UsersEntity
 *
 * Type de données pour les structures
 * @typedef {import("../structures/User.js").default} User
 * @typedef {import("../structures/Agenda.js").default} Agenda
 */

/**
 * Représente une structure d'agenda
 * @extends {EntityStructure} Les structures d'entité
 */
export default class Guest extends EntityStructure {
  /**
   * Crée une structure d'agenda
   * @param {Entity} [entity] L'entité du guest
   * @param {Object} [data] Les données du guest
   * @constructor
   */
  constructor(entity, data) {
    super(entity, data);

    /**
     * L'identifiant du tuple agenda, guest
     * @type {int}
     */
    this.id = data.id;

    /**
     * L'identifiant de l'agenda
     * @type {int}
     */
    this.agendaId = data.agendaId;

    /**
     * L'identifiant du guest
     * @type {int}
     */
    this.guestId = data.guestId;

    /**
     * Le role du guest
     * @type {string}
     */
    this.role = data.role;

    /**
     * Si le guest est invité sans validation
     * @type {boolean}
     */
    this.invited = data.invited;
  }

  /**
   * Récupère les utilisateurs
   * @returns {UsersEntity} Les utilisateurs
   */
  get users() {
    return this.database.get('users');
  }

  /**
   * Récupère les agendas
   * @returns {AgendasEntity} Les agendas
   */
  get agendas() {
    return this.database.get('agendas');
  }

  /**
   * Met à jour les données de l'agenda
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<Guest>} Une promesse de l'agenda
   */
  async update(data) {
    this.role = data.role;
    this.invited = data.invited;

    return this.entity.update((x) => x.id === this.id, data);
  }

  /**
   * Supprime le guest
   * @returns {Promise<void>} Une promesse
   */
  async delete() {
    return this.entity.delete((x) => x.id === this.id);
  }

  /**
   * Récupère le propriétaire de l'agenda
   * @returns {User} L'utilisateur
   */
  getGuest() {
    return this.users.get(this.guestId.toString());
  }

  /**
   * Récupère l'agenda lié au partage
   * @returns {Agenda} L'agenda
   */
  getAgenda() {
    return this.agendas.get(this.agendaId.toString());
  }

  /**
   * Récupère le propriétaire de l'agenda lié au partage
   * @returns {User} L'utilisateur
   */
  getOwner() {
    return this.getAgenda().getOwner();
  }
}
