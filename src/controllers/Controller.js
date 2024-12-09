/**
 * Type de données pour les composants iCal.js
 * @typedef {import("ical.js").Component} Component
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
   * @returns {Map<String, Object>}
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
   * @returns {Object}
   */
  get guests() {
    return this.database.get('guests');
  }

  /**
   * Récupère les utilisateurs
   * @returns {Object}
   */
  get users() {
    return this.database.get('users');
  }

  /**
   * Récupère les agendas
   * @returns {Object}
   */
  get agendas() {
    return this.database.get('agendas');
  }

  /**
   * Récupère les événements
   * @returns {Object}
   */
  get events() {
    return this.database.get('events');
  }

  /**
   * Importe les événements d'un fichier iCal
   * @param events {Component[]} Les événements
   * @param agendaId {String} L'identifiant de l'agenda
   * @param countEvents {number} Nombre d'events importés
   */
  async importEvents(events, agendaId, countEvents = 0) {
    for (const event of events) {
      const eventName = event.getFirstPropertyValue('summary');
      const dtstartProp = event.getFirstProperty('dtstart');
      const dtendProp = event.getFirstProperty('dtend');
      if (eventName && dtstartProp && dtendProp) {
        const startDate = new Date(dtstartProp.getFirstValue().toString());
        const endDate = dtendProp ? new Date(dtendProp.getFirstValue().toString()) : startDate;
        const eventDescription = event.getFirstPropertyValue('description') || '';

        const dtstartValue = dtstartProp.getFirstValue();
        const isAllDay = dtstartValue && typeof dtstartValue === 'object' && dtstartValue.isDate === true;

        if (startDate && endDate) {
          await this.events.create({
            name: eventName,
            agendaId,
            startDate: startDate,
            endDate: endDate,
            description: eventDescription,
            allDay: isAllDay
          });
          countEvents++;
        }
      }
    }
    return countEvents;
  }
}
