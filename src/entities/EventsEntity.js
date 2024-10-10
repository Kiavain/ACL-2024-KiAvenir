import Entity from "../structures/Entity.js";
import Event from "./structures/Event.js";
import { DataTypes } from "sequelize";

/**
 * Représente l'entité des sagenda
 */
export default class EventsEntity extends Entity {
  /**
   * Construit l'entité des agendas
   * @param server {KiAvenir} Le serveur de l'application
   * @constructor
   */
  constructor(server) {
    super(server, {
      eventId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      agendaId: {
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
   * @returns {Event} La structure de l'entité
   */
  get entityStructure() {
    return Event;
  }

  /**
   * Récupère le nom de la table
   * @returns {string} Le nom de la table
   */
  get tableName() {
    return "events";
  }

  /**
   * Récupère les colonnes d'identifiant
   * @returns {string[]} Les colonnes d'identifiant
   */
  get identifierColumns() {
    return ["eventId", "agendaId"];
  }
}