import { Op } from "sequelize";

/**
 * Représente une table de la base de données.
 */
export default class Entity {
  /**
   * Constuire une nouvelle table
   * @param server {KiAvenir} Le serveur
   * @param definition {Object} La définition de la table
   * @param options {Object} Les options
   * @constructor
   */
  constructor(server, definition = {}, options = {}) {
    /**
     * Le cache de la table
     * @type {Map<String, Object>}
     */
    this.cache = new Map();

    /**
     * Le serveur
     * @type {KiAvenir}
     */
    this.server = server;

    /**
     * La définition de la table
     * @type {Object}
     */
    this.definition = definition;

    /**
     * Les options
     * @type {{freezeTableName: boolean}}
     */
    this.options = {
      freezeTableName: true,
      ...options
    };
  }

  /**
   * Récupère la structure de la base de données
   */
  get entityStructure() {
    throw new Error("La structure de l'entité est invalide");
  }

  /**
   * Récupère le nom de la table
   */
  get tableName() {
    throw new Error("Nom de table invalide");
  }

  /**
   * Récupère les colonnes d'identifiant (primary key)
   */
  get identifierColumns() {
    throw new Error("Invalid table identifier");
  }

  /**
   * Récupère la table dans la base de données
   * @return {Object} La table
   */
  get table() {
    return this.server.database.models[this.tableName];
  }

  /**
   * Charge la table dans le cache
   * @return {Promise<void>}
   */
  async load() {
    try {
      await this.table.sync(); // Synchronise la table avec les fichiers de structure

      // Récupère toutes les lignes de la table
      const rows = await this.table.findAll();
      for (const row of rows) {
        const data = row.dataValues;
        const key = this.identifierColumns.map((c) => data[c]).join(":");

        this.cache.set(
          `${this.tableName}:${key}`, // Stocke la ligne dans le cache avec les clés primaires
          new this.entityStructure(this, data) // Crée une nouvelle structure d'entité avec les données
        );
      }
    } catch (e) {
      console.error("Synchronisation : ", e);
    }
  }

  /**
   * Actualise le cache sans recharger la table entière
   */
  async refreshCache() {
    try {
      // Récupère toutes les lignes de la table sans synchroniser
      const rows = await this.table.findAll();

      for (const row of rows) {
        const data = row.dataValues;
        const key = this.identifierColumns.map((c) => data[c]).join(":");

        // Met à jour le cache avec les nouvelles données
        this.cache.set(`${this.tableName}:${key}`, new this.entityStructure(this, data));
      }
    } catch (e) {
      console.error("Erreur lors de la mise à jour du cache : ", e);
    }
  }

  /**
   * Vérifie si l'entité a la clé primaire
   * @param key {string} La clé primaire
   * @returns {boolean} Si l'entité a la clé primaire
   */
  has(...key) {
    return this.cache.has(`${this.tableName}:${key.map((x) => x).join(":")}`);
  }

  /**
   * Récupère toutes les lignes
   * @return {EntityStructure[]} Les lignes
   */
  getAll() {
    return [...this.cache.values()];
  }

  /**
   * Filtre les lignes
   * @param fn {Function} La fonction de filtre
   * @returns {EntityStructure[]} Les lignes filtrées
   */
  filter(fn) {
    const data = this.getAll();
    return data.filter(fn);
  }

  /**
   * Vérifie si toutes les lignes respectent la condition
   * @param fn {Function} La fonction de filtre
   * @returns {boolean} Si toutes les lignes respectent la condition
   */
  every(fn) {
    const data = this.getAll();
    return data.every(fn);
  }

  /**
   * Vérifie si au moins une ligne respect la condition
   * @param fn {Function} La fonction de filtre
   * @returns {boolean} Si au moins une ligne respect
   */
  some(fn) {
    const data = this.getAll();
    return data.some(fn);
  }

  /**
   * Récupère une ligne
   * @param key {string} La clé primaire
   * @returns {EntityStructure} La ligne
   */
  get(...key) {
    return this.cache.get(`${this.tableName}:${key.map((x) => x).join(":")}`);
  }

  /**
   * Récupère une ligne
   * @param fn {Function} La fonction de filtre
   * @returns {unknown[]} Les lignes
   */
  map(fn) {
    const data = this.getAll();
    return data.map(fn);
  }

  /**
   * Trouve une ligne
   * @param fn {Function} La fonction de filtre
   * @return {EntityStructure} La ligne
   */
  find(fn) {
    const data = this.getAll();
    return data.find(fn);
  }

  /**
   * Récupère une ligne suivant les indices
   * @param start {number} L'index de départ
   * @param end {number} L'index de fin
   * @returns {EntityStructure[]} Les lignes
   */
  slice(start, end) {
    const data = this.getAll();
    return data.slice(start, end);
  }

  /**
   * Trie les lignes
   * @param fn {Function} La fonction de tri
   * @returns {EntityStructure[]} Les lignes triées
   */
  sort(fn) {
    const data = this.getAll();
    return data.sort(fn);
  }

  /**
   * Crée une ligne
   * @param data {Object} Les données
   * @returns {Promise<EntityStructure>} La ligne
   */
  async create(data) {
    let structure = null;

    try {
      const created = await this.table.create(data);
      const key = this.identifierColumns.map((c) => created.dataValues[c]).join(":");

      structure = new this.entityStructure(this, created.dataValues);

      await this.cache.set(`${this.tableName}:${key}`, structure);
    } catch (err) {
      console.error(err);
    }
    return structure;
  }

  /**
   * Met à jour une ligne
   * @param fn {Function} La condition
   * @param data {Object} Les données
   * @returns {Promise<EntityStructure|*>} Les lignes
   */
  async update(fn, data) {
    let updatedRows = [];

    try {
      const all = this.filter(fn);
      const where = [];

      for (const row of all.map((v) => v.data).filter(fn)) {
        const w = {};

        for (const column of this.identifierColumns) {
          w[column] = {
            [Op.eq]: row[column]
          };
        }

        where.push(w);
      }

      await this.table.update(data, { where: { [Op.or]: where } });
      updatedRows = await this.table.findAll({ where: { [Op.or]: where } });

      for (const row of updatedRows) {
        const data = row.dataValues;
        const key = this.identifierColumns.map((c) => data[c]).join(":");

        await this.cache.set(`${this.tableName}:${key}`, new this.entityStructure(this, data));
      }
    } catch (err) {
      console.error(err);
    }

    return updatedRows.map((u) => new this.entityStructure(this, u.dataValues));
  }

  /**
   * Supprime une ligne
   * @param fn {Function} La condition
   * @returns {Promise<void>} La ligne
   */
  async delete(fn) {
    try {
      const all = this.filter(fn);
      const where = [];

      for (const row of all) {
        const w = {};

        for (const column of this.identifierColumns) {
          w[column] = {
            [Op.eq]: row[column]
          };
        }

        // Suppression de la ligne dans le cache
        const key = this.identifierColumns.map((c) => row.data[c]).join(":");
        this.cache.delete(`${this.tableName}:${key}`);

        where.push(w);
      }

      // Suppression de la ligne dans la base de données
      await this.table.destroy({ where: { [Op.or]: where } });
    } catch (err) {
      console.error(err);
    }
  }
}
