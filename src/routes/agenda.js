import Routeur from "../structures/Routeur.js";
import { AgendaController } from "../controllers/AgendaController.js";
import multer from "multer";

/**
 * Les routes liées à la page de l'agenda
 */
// noinspection JSUnusedGlobalSymbols // Utilisé par le serveur
export default class AgendaRouteur extends Routeur {
  /**
   * Construit le routeur
   * @param server {KiAvenir} L'instance du serveur
   * @constructor
   * @override
   */
  constructor(server) {
    super(server, new AgendaController(server));
  }

  /**
   * Construit la route
   * @override
   */
  build() {
    const upload = multer({ dest: "uploads/" });
    this.router
      // Rendu des pages
      .get("/agenda", this.controller.renderAgenda)
      .get("/agenda/:agendaId", this.controller.renderAgendaId)

      // Gesion des agendas
      .put("/api/agenda/create", this.controller.createAgenda)
      .put("/api/agenda/:agendaId/update", this.controller.updateAgenda)
      .put("/api/agenda/:agendaId/exportAgenda", this.controller.exportAgenda)
      .put("/api/agenda/importAgenda", upload.single("file"), this.controller.importAgenda)
      .delete("/api/agenda/:agendaId/delete", this.controller.deleteAgenda)

      // Gestion des invités
      .get("/getGuests", this.controller.getGuests)
      .put("/api/agenda/:agendaId/shareAgenda", this.controller.shareAgenda)
      .put("/api/agenda/updateGuest", this.controller.updateGuest)
      .delete("/api/agenda/removeGuest", this.controller.removeGuest);
  }
}
