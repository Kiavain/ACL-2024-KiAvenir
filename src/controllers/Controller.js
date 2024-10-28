/**
 * Classe de base pour les contrôleurs
 *
 * @class Controller
 */
export default class Controller {
  /**
   * Crée un contrôleur
   * @param server {KiAvenir} Le serveur
   * @constructor
   */
  constructor(server) {
    this.server = server;
  }

  /**
   * Récupère la base de données
   * @returns {Map<String, Object>} La base de données
   */
  get database() {
    return this.server.database.tables;
  }

  /**
   * Récupère le logger
   * @returns {KiLogger} Le logger
   */
  get logger() {
    return this.server.logger;
  }

  /**
   * Récupère les invités
   * @returns {Object}
   */
  get guests() {
    return this.database.get("guests");
  }

  /**
   * Récupère les utilisateurs
   * @returns {Object}
   */
  get users() {
    return this.database.get("users");
  }

  /**
   * Récupère les agendas
   * @returns {Object}
   */
  get agendas() {
    return this.database.get("agendas");
  }

  /**
   * Récupère les événements
   * @returns {Object}
   */
  get events() {
    return this.database.get("events");
  }
}
