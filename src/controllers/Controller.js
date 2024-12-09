/**
 * Type de données pour les composants iCal.js
 * @typedef {import("ical.js").Component} Component
 *
 * Type de données pour les entités
 * @typedef {import("../entities/AgendasEntity").default} AgendasEntity
 * @typedef {import("../entities/EventsEntity.js").default} EventsEntity
 * @typedef {import("../entities/EventOccurrencesEntity.js").default} EventOccurrencesEntity
 * @typedef {import("../entities/GuestsEntity.js").default} GuestsEntity
 * @typedef {import("../entities/UsersEntity.js").default} UsersEntity
 *
 */

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
   * Récupère le serveur
   * @returns {Map<String, Entity>}
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
   * @returns {GuestsEntity}
   */
  get guests() {
    return this.database.get('guests');
  }

  /**
   * Récupère les utilisateurs
   * @returns {UsersEntity}
   */
  get users() {
    return this.database.get('users');
  }

  /**
   * Récupère les agendas
   * @returns {AgendasEntity}
   */
  get agendas() {
    return this.database.get('agendas');
  }

  /**
   * Récupère les événements
   * @returns {EventsEntity}
   */
  get events() {
    return this.database.get('events');
  }

  /**
   * Récupère les occurrences d'événements
   * @returns {EventOccurrencesEntity}
   */
  get eventOccurrences() {
    return this.database.get('event_occurrences');
  }

  /**
   * Importe les événements d'un fichier iCal
   * @param events {Component[]} Les événements
   * @param agendaId {String} L'identifiant de l'agenda
   * @param countEvents=0 {number} Nombre d'events importés
   */
  async importEvents(events, agendaId, countEvents = 0) {
    // Filtre les événements valides
    const validEvents = events.filter((event) => {
      const summary = event.getFirstPropertyValue('summary');
      const dtstart = event.getFirstProperty('dtstart');
      const dtend = event.getFirstProperty('dtend');

      // Récupère les dates de début et de fin
      const startDate = new Date(dtstart.getFirstValue().toString());
      const endDate = dtend ? new Date(dtend.getFirstValue().toString()) : startDate;

      return summary && dtstart && dtend && !isNaN(startDate.valueOf()) && !isNaN(endDate.valueOf());
    });

    // Importe les événements valides
    for (const event of validEvents) {
      // Récupère les informations de l'événement
      const name = event.getFirstPropertyValue('summary');
      const description = event.getFirstPropertyValue('description') || '';
      const dtstartProp = event.getFirstProperty('dtstart');
      const dtendProp = event.getFirstProperty('dtend');

      // Récupère les dates de début et de fin
      const startDate = new Date(dtstartProp.getFirstValue().toString());
      const endDate = dtendProp ? new Date(dtendProp.getFirstValue().toString()) : startDate;

      // Vérifie si l'événement est sur toute la journée
      const dtstartValue = dtstartProp.getFirstValue();
      const allDay = dtstartValue && typeof dtstartValue === 'object' && dtstartValue.isDate === true;

      // Crée l'événement
      await this.events.create({ name, agendaId, startDate, endDate, description, allDay });
    }

    return countEvents + validEvents.length;
  }
}
