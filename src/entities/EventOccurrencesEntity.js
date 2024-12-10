import Entity from '../structures/Entity.js';
import EventOccurrence from './structures/EventOccurrence.js';
import { DataTypes } from 'sequelize';

/**
 * Représente l'entité des occurrences d'événements
 */
export default class EventOccurrencesEntity extends Entity {
  /**
   * Construit l'entité des occurrences d'événements
   * @param server {KiAvenir} Le serveur de l'application
   * @constructor
   */
  constructor(server) {
    super(server, {
      occurrenceId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      eventId: {
        type: DataTypes.INTEGER
      },
      occurrenceStart: {
        type: DataTypes.DATE
      },
      occurrenceEnd: {
        type: DataTypes.DATE
      },
      name: {
        type: DataTypes.STRING(32)
      },
      description: {
        type: DataTypes.TEXT
      },
      allDay: {
        type: DataTypes.BOOLEAN
      },
      isCancelled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      unit: {
        type: DataTypes.INTEGER
      },
      interval: {
        type: DataTypes.INTEGER
      }
    });
  }

  /**
   * Récupère la structure de l'entité
   * @returns {EventOccurrence} La structure de l'entité
   */
  get entityStructure() {
    return EventOccurrence;
  }

  /**
   * Récupère le nom de la table
   * @returns {string} Le nom de la table
   */
  get tableName() {
    return 'event_occurrences';
  }

  /**
   * Récupère les colonnes d'identifiant
   * @returns {string[]} Les colonnes d'identifiant
   */
  get identifierColumns() {
    return ['occurrenceId'];
  }
}
