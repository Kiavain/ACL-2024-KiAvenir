import EntityStructure from '../../structures/EntityStructure.js';

/**
 * Type de données pour les entités
 * @typedef {import("../EventsEntity.js").default} EventsEntity
 * @typedef {import("../GuestsEntity.js").default} GuestsEntity
 * @typedef {import("../UsersEntity.js").default} UsersEntity
 *
 * Type de données pour les structures
 * @typedef {import("../structures/User.js").default} User
 * @typedef {import("../structures/Event.js").default} Event
 * @typedef {import("../structures/Guest.js").default} Guest
 */

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

    /**
     * La description de l'agenda
     * @type {string}
     */
    this.description = data.description;

    /**
     * Permet de savoir si l'agenda est spécial (Autres agendas : Vacances, Jours fériés, etc.)
     * @type {boolean}
     */
    this.special = data.special;
  }

  /**
   * Récupère les utilisateurs
   * @returns {UsersEntity} Les utilisateurs
   */
  get users() {
    return this.database.get('users');
  }

  /**
   * Récupère les événements
   * @returns {EventsEntity} Les événements
   */
  get events() {
    return this.database.get('events');
  }

  /**
   * Récupère les invités
   * @returns {GuestsEntity} Les invités
   */
  get guests() {
    return this.database.get('guests');
  }

  /**
   * Met à jour les données de l'agenda
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<Agenda>} Une promesse de l'agenda
   */
  async update(data) {
    this.name = data.name;
    this.color = data.color;
    this.description = data.description;
    this.special = data.special;

    return this.entity.update((x) => x.agendaId === this.agendaId, data);
  }

  /**
   * Supprime l'agenda
   * @returns {Promise<void>} Une promesse
   */
  async delete() {
    const eventDeletionPromises = this.getEvents().map((event) => event.delete());
    const guestDeletionPromises = this.getGuests().map((guest) => guest.delete());

    await Promise.all([...eventDeletionPromises, ...guestDeletionPromises]);
    return this.entity.delete((x) => x.agendaId === this.agendaId);
  }

  /**
   * Vérifie si l'utilisateur peut éditer l'agenda
   * @param userId {int} L'identifiant de l'utilisateur
   * @returns {boolean} Vrai si l'utilisateur peut éditer l'agenda
   */
  verifyCanEdit(userId) {
    const isOwner = this.ownerId === userId;
    const isGuest = this.getGuests().some((x) => x.guestId === userId && x.role === 'Editeur' && !x.invited);

    return isOwner || isGuest;
  }
  /**
   * Vérifie l'accès à l'agenda
   * @param userId {int} L'identifiant de l'utilisateur
   * @returns {boolean} Vrai si l'accès est vérifié
   */
  verifyAgendaAccess(userId) {
    const isOwner = this.ownerId === userId;
    const isGuest = this.getGuests().some((x) => x.guestId === userId && !x.invited);

    return isOwner || isGuest;
  }

  /**
   * Récupère le propriétaire de l'agenda
   * @returns {User} L'utilisateur
   */
  getOwner() {
    return this.users.get(this.ownerId.toString());
  }

  /**
   * Récupère les événements de l'agenda
   * @returns {Event[]} Les événements
   */
  getEvents() {
    return this.events.filter((x) => x.agendaId === this.agendaId);
  }

  /**
   * Récupère les invités de l'agenda
   * @returns {Guest[]} Les invités
   */
  getGuests() {
    return this.guests.filter((x) => x.agendaId === this.agendaId);
  }
}
