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
    this.router.delete("/api/events/delete/:eventId", async (req, res) => {
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

    this.router.put("/api/events/update/:eventId", async (req, res) => {
      const event = this.server.database.tables
        .get("events")
        .get(req.params.eventId);

      if (event) {
        await event.update(req.body);
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    });

    // Route pour créer un événement
    this.router.put("/api/events/create", async (req, res) => {
      const newEvent = await this.server.database.tables.get("events");
      if (newEvent) {
        await newEvent.create(req.body);
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    });
  }
}

export default EventRouteur;
