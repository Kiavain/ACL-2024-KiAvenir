import Routeur from "../structures/Routeur.js";

/**
 * Les routes liées à la page des événements
 */
export default class EventRouteur extends Routeur {
  constructor(server) {
    super(server, null);
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
    this.router.post("/api/events/create", (req, res) => {
      const newEvent = this.server.database.tables.get("events");
      if (newEvent) {
        newEvent
          .create(req.body)
          .then(() => {
            res.json({ success: true, message: "Événement créé avec succès" });
          })
          .catch(() => {
            res.json({
              success: false,
              message: "Erreur lors de la création de l'événement"
            });
          });
      } else {
        res.json({
          success: false,
          message: "Erreur lors de la création de l'événement"
        });
      }
    });
  }
}