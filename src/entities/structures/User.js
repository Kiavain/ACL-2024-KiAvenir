import EntityStructures from "../../structures/EntityStructure.js";
import { encryptPassword } from "../../utils/index.js";
import crypto from "crypto";

/**
 * Représente la structure d'un utilisateur
 * @extends {EntityStructures} Les structures d'entité
 */
export default class User extends EntityStructures {
  /**
   * Construit la structure d'un utilisateur
   * @param entity {Entity} L'entité de l'utilisateur
   * @param data {Object} Les données de l'utilisateur
   * @constructor
   */
  constructor(entity, data) {
    super(entity, data);

    /**
     * L'identifiant de l'utilisateur
     * @type {int}
     */
    this.id = data.id;

    /**
     * Le nom d'utilisateur
     * @type {String}
     */
    this.username = data.username;

    /**
     * L'email de l'utilisateur
     * @type {String}
     */
    this.email = data.email;

    /**
     * Le mot de passe de l'utilisateur
     * @type {String}
     */
    this.password = data.password;

    /**
     * Le sel de l'utilisateur
     * @type {String}
     */
    this.salt = data.salt;

    /**
     * Le token de réinitialisation
     * @type {String}
     */
    this.reset_token = data.reset_token;

    /**
     * La dernière date de mise à jour
     * @type {Date}
     */
    this.updatedAt = new Date(data.updatedAt);
  }

  /**
   * Récupère les agendas
   * @returns {Object} Les agendas
   */
  get agendas() {
    return this.entity.server.database.tables.get("agendas");
  }

  /**
   * Récupère toutes les invitations dans lesquelles l'utilisateur est présent
   * @returns {Object} Les invitations
   */
  get guests() {
    return this.entity.server.database.tables.get("guests");
  }

  /**
   * Met à jour l'utilisateur
   * @param data {Object} Les données à mettre à jour
   * @returns {Promise<User>} L'utilisateur
   */
  async update(data) {
    this.reset_token = data.reset_token || this.reset_token;
    this.password = data.password || this.password;
    this.salt = data.salt || this.salt;
    this.username = data.username || this.username;
    this.email = data.email || this.email;

    return this.entity.update((x) => x.id === this.id, data);
  }

  /**
   * Supprime l'utilisateur
   * @returns {Promise<void>} L'utilisateur
   */
  async delete() {
    const agendaDelationPromises = this.getAgendas().map((agenda) => agenda.delete());
    const guestDeletionPromises = this.getGuests().map((guest) => guest.delete());

    await Promise.all([...agendaDelationPromises, ...guestDeletionPromises]);
    return this.entity.delete((x) => x.id === this.id);
  }

  /**
   * Récupère les agendas de l'utilisateur
   * @returns {Agenda[]} L'aganda
   */
  getAgendas() {
    return this.agendas.filter((x) => x.ownerId === this.id);
  }

  /**
   * Récupère les invités de l'utilisateur
   * @returns {Guest[]} Les invités
   */
  getGuests() {
    return this.guests.filter((x) => x.guestId === this.id);
  }

  /**
   * Vérifie le mot de passe de l'utilisateur
   * @param password {String} Le mot de passe saisi
   * @returns {boolean} L'utilisateur
   */
  checkPassword(password) {
    return this.password === encryptPassword(password, this.salt);
  }

  /**
   * Réinitialise le mot de passe de l'utilisateur
   * @returns {Promise<void>}
   */
  async resetPassword() {
    this.reset_token = crypto.randomBytes(32).toString("hex");
    await this.update({ reset_token: this.reset_token });
  }

  /**
   * Vérifie le token de réinitialisation
   * @param token {String} Le token de réinitialisation
   * @returns {boolean} Si le token est valide
   */
  checkResetToken(token) {
    const date = new Date();
    const isExpired = date.getTime() - this.updatedAt > 600000;
    return this.reset_token === token && this.reset_token !== "" && !isExpired;
  }
}
