import EntityStructure from "../../structures/EntityStructure.js";

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
     * L'identifiant du tuple agenda,guest
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
  }

  /**
   * Récupère les utilisateurs
   * @returns {Object} Les utilisateurs
   */
  get users() {
    return this.entity.server.database.tables.get("users");
  }

  /**
   * Récupère les agendas
   * @returns {Object} Les agendas
   */
  get agendas() {
    return this.entity.server.database.tables.get("agendas");
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
    return this.users.get(this.guestId);
  }

  /**
   * Récupère l'agenda lié au partage
   * @returns {Agenda} L'agenda
   */
  getAgenda() {
    return this.agendas.get(this.agendaId);
  }

  /**
   * Récupère le rôle du guest
   * @returns {string} Le rôle
   */
  getRole() {
    return this.role;
  }
}