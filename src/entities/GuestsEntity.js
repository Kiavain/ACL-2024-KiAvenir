import Entity from "../structures/Entity.js";
import { DataTypes } from "sequelize";
import Guest from "./structures/Guest.js";

/**
 * Représente l'entité des Guests
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par la base de données
export default class GuestsEntity extends Entity {
  /**
   * Construit l'entité des agendas
   * @param server {KiAvenir} Le serveur de l'application
   * @constructor
   */
  constructor(server) {
    super(server, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      agendaId: {
        type: DataTypes.INTEGER
      },
      guestId: {
        type: DataTypes.INTEGER
      },
      role: {
        type: DataTypes.STRING(32)
      }
    });
  }

  /**
   * Récupère la structure de l'entité
   * @returns {Guest} La structure de l'entité
   */
  get entityStructure() {
    return Guest;
  }

  /**
   * Récupère le nom de la table
   * @returns {string} Le nom de la table
   */
  get tableName() {
    return "guests";
  }

  /**
   * Récupère les colonnes d'identifiant
   * @returns {string[]} Les colonnes d'identifiant
   */
  get identifierColumns() {
    return ["id"];
  }
}
