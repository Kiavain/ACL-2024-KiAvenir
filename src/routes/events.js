import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page des événements
 */
class EventRouteur extends Routeur {
  constructor(server) {
    super(server);
  }

  /**
   * Construit la route
   */
  build() {
    this.router.get("/api/events/delete/:eventId", async (req, res) => {
      const event = this.server.database.tables
        .get("events")
        .get(req.params.eventId);

      if (event) {
        await event.delete();
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    });
  }
}

export default EventRouteur;
