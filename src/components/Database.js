import { Sequelize } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { getDirname } from "../utils/index.js";

/**
 * Représente la base de données
 */
export default class Database {
  constructor(server) {
    this.server = server;
    this.connector = null;
    this.tables = new Map();
  }

  /**
   * Get the models
   * @return The models
   */
  get models() {
    return this.connector.models;
  }

  /**
   * Load the database
   * @return {Promise<void>} The promise
   */
  async load() {
    this.connector = new Sequelize({
      dialect: "sqlite",
      storage: "data/db.sqlite",
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

    // Récupère les fichiers des entités
    const modelsPath = path.join(getDirname(import.meta.url), "../entities");
    const modelsFiles = await fs.readdir(modelsPath);

    for (const file of modelsFiles) {
      // Vérifie que l'on traite bien un fichier JS
      if (!file.endsWith(".js")) {
        continue;
      }

      // Récupère la classe de l'entité
      const modulePath = path.join(modelsPath, file);
      const { default: Table } = await import(modulePath);
      const table = new Table(this.server);

      // Définit la table dans la base de données avec la structure du fichier JS
      await this.connector?.define(
        table.tableName,
        table.definition,
        table.options
      );

      await table.load();

      this.tables.set(table.tableName, table);
    }

    await this.connector?.authenticate();
  }
}
