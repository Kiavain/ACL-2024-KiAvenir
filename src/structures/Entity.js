import { Op } from "sequelize";

/**
 * Représente une table de la base de données.
 */
export default class Entity {
  /**
   * Constuire une nouvelle table
   * @param server {KiAvenir} - Le serveur
   * @param definition {Object} - La définition de la table
   * @param options {Object} - Les options
   */
  constructor(server, definition = {}, options = {}) {
    this.server = server;
    this.cache = new Map();
    this.definition = definition;
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
   * @return {*} La table
   */
  get table() {
    return this.server.database.connector.models[this.tableName];
  }

  /**
   * Charge la table dans le cache
   * @return {Promise<void>}
   */
  async load() {
    await this.table.sync({ alter: true }); // Synchronise la table avec les fichiers de structure

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
  }

  /**
   * Vérifie si l'entité a la clé primaire
   * @param key {string} - La clé primaire
   * @returns {boolean}  - Si l'entité a la clé primaire
   */
  has(...key) {
    return this.cache.has(`${this.tableName}:${key.map((x) => x).join(":")}`);
  }

  /**
   * Get all the rows
   * @return {*} The rows
   */
  getAll() {
    return this.cache.values();
  }

  /**
   * Filter the rows
   * @param {Function} fn The filter function
   * @return {*} The filtered rows
   */
  filter(fn) {
    const data = this.getAll();
    return data.filter(fn);
  }

  /**
   * Check if every row respect the condition
   * @param {Function} fn The filter function
   * @return {Boolean} The result
   */
  every(fn) {
    const data = this.getAll();
    return data.every(fn);
  }

  /**
   * Check if one of the rows respect the condition
   * @param {Function} fn The filter function
   * @return {Boolean} The result
   */
  some(fn) {
    const data = this.getAll();
    return data.some(fn);
  }

  /**
   * Get the row with key
   * @param {String} key The key
   * @return {*} The row
   */
  get(...key) {
    return this.cache.get(`${this.tableName}:${key.map((x) => x).join(":")}`);
  }

  /**
   * Map the rows
   * @param {Function} [fn] The map function
   * @return {*} The mapped rows
   */
  map(fn) {
    const data = this.getAll();
    return data.map(fn);
  }

  /**
   * Get the rows in array
   * @return {*} The rows
   */
  array() {
    return this.getAll();
  }

  /**
   * Find rows with the condition
   * @param {Function} [fn] The condition
   * @return {*} The rows
   */
  find(fn) {
    const data = this.getAll();
    return data.find(fn);
  }

  /**
   * Slice the rows
   * @param {Number} [start] The start
   * @param {Number} [end] The end
   * @return {*} The sliced rows
   */
  slice(start, end) {
    const data = this.getAll();
    return data.slice(start, end);
  }

  /**
   * Sort the rows
   * @param {Function} [fn] The sort function
   * @return {*} The sorted rows
   */
  sort(fn) {
    const data = this.getAll();
    return data.sort(fn);
  }

  /**
   * Create a row
   * @param {Object} [data] The data
   * @return {Promise<*>} The row
   */
  async create(data) {
    const created = await this.table.create(data);
    const key = this.identifierColumns
      .map((c) => created.dataValues[c])
      .join(":");

    const structure = new this.entityStructure(this, created.dataValues);

    await this.cache.set(`${this.tableName}:${key}`, structure);
    return structure;
  }

  /**
   * Update a row
   * @param {Function} [fn] The condition
   * @param {Object} [data] The data
   * @return {Promise<*>} The row
   */
  async update(fn, data) {
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

    const updated = await this.table.update(data, {
      where: { [Op.or]: where },
      returning: true
    });

    for (const row of updated[1]) {
      const data = row.dataValues;
      const key = this.identifierColumns.map((c) => data[c]).join(":");

      await this.cache.set(
        `${this.tableName}:${key}`,
        new this.entityStructure(this, data)
      );
    }

    return updated[1].map((u) => new this.entityStructure(this, u.dataValues));
  }

  /**
   * Delete a row
   * @param {Function} [fn] The condition
   * @return {Promise<void>} The result
   */
  async delete(fn) {
    const all = this.filter(fn);
    const where = [];

    for (const row of all) {
      const w = {};

      for (const column of this.identifierColumns) {
        w[column] = {
          [Op.eq]: row[column]
        };
      }

      where.push(w);
    }

    await this.table.destroy({ where: { [Op.or]: where } });
  }
}
