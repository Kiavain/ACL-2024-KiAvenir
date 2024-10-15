import Entity from "../structures/Entity.js";
import Agenda from "./structures/Agenda.js";
import { DataTypes } from "sequelize";

/**
 * Représente l'entité des sagenda
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par la base de données
export default class UsersEntity extends Entity {
  /**
   * Construit l'entité des agendas
   * @param server {KiAvenir} Le serveur de l'application
   * @constructor
   */
  constructor(server) {
    super(server, {
      agendaId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      ownerId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(32)
      },
      color: {
        type: DataTypes.STRING(7)
      }
    });
  }

  /**
   * Récupère la structure de l'entité
   * @returns {Agenda} La structure de l'entité
   */
  get entityStructure() {
    return Agenda;
  }

  /**
   * Récupère le nom de la table
   * @returns {string} Le nom de la table
   */
  get tableName() {
    return "agendas";
  }

  /**
   * Récupère les colonnes d'identifiant
   * @returns {string[]} Les colonnes d'identifiant
   */
  get identifierColumns() {
    return ["agendaId", "ownerId"];
  }
}
