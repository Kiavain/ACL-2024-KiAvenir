import { Sequelize } from "sequelize";
import fs from "fs/promises";
import { getDirname } from "../utils/index.js";
import { pathToFileURL } from "url";
import path from "path";

// Obtenir __dirname en mode ES module
const __dirname = getDirname(import.meta.url);

/**
 * Représente la base de données
 */
export default class Database {
  /**
   * Construit la base de données
   * @param server {KiAvenir} Le serveur
   */
  constructor(server) {
    /**
     * Le serveur
     * @type {KiAvenir}
     */
    this.server = server;

    /**
     * Le connecteur de la base de données
     * @type {Sequelize}
     */
    this.connector = new Sequelize({
      dialect: "sqlite",
      storage: process.env.NODE_ENV === "test" ? "data/testdb.sqlite" : "data/db.sqlite",
      logging: false,
      define: {
        charset: "utf8",
        collate: "utf8_unicode_ci",
        timestamps: true
      },
      pool: {
        min: 0,
        max: 5,
        acquire: 30000,
        idle: 10000
      }
    });

    /**
     * Les tables de la base de données
     * @type {Map<String, Object>}
     */
    this.tables = new Map();
  }

  /**
   * Récupère les modèles de la base de données
   * @return {{[key: string]: Object}} Les modèles
   */
  get models() {
    return this.connector.models;
  }

  /**
   * Load the database
   * @return {Promise<void>} The promise
   */
  async load() {
    // Récupère les fichiers des entités
    const modelsPath = path.join(getDirname(import.meta.url), "../entities");
    const modelsFiles = await fs.readdir(modelsPath);

    for (const file of modelsFiles) {
      // Vérifie que l'on traite bien un fichier JS
      if (!file.endsWith(".js")) {
        continue;
      }

      // Récupère la classe de l'entité
      const modulePath = path.join(__dirname, "../entities", file);
      const moduleURL = pathToFileURL(modulePath).href; // Convertir en URL
      const { default: Table } = await import(moduleURL); // Utiliser l'URL pour l'import dynamique
      const table = new Table(this.server);

      // Définit la table dans la base de données
      await this.connector?.define(table.tableName, table.definition, table.options);
      await table.load();
      this.tables.set(table.tableName, table);
    }

    await this.connector?.authenticate();
  }

  /**
   * Synchronise la base de données
   * @return {Promise<void>} La promesse
   */
  async sync() {
    try {
      await this.connector?.sync();

      for (const table of this.tables.values()) {
        await table.refreshCache();
      }
    } catch {
      // Ignore
    }
  }
}
