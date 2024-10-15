/**
 * Classe de base pour les contrôleurs
 *
 * @class Controller
 */
export default class Controller {
  /**
   * Crée un contrôleur
   * @param server {KiAvenir} Le serveur
   */
  constructor(server) {
    this.server = server;
  }

  /**
   * Récupère la base de données
   * @returns {Database} La base de données
   */
  get db() {
    return this.server.database;
  }

  /**
   * Récupère la base de données
   * @returns {Map<String, Object>} La base de données
   */
  get database() {
    return this.db.tables;
  }
}
