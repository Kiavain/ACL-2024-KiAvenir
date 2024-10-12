/**
 * Construit la base de données de développement
 * @param server {KiAvenir} Le serveur
 */
export function devDatabase(server) {
  const db = server.database.tables;

  // Création des données pour les utilisateurs
  const users = db.get("users");
  users.getAll().forEach((user) => user.delete());
  const lowan = users.create({
    username: "test",
    password: "test",
    email: "test@test.com"
  });

  // Création des données pour les agendas
  const agendas = db.get("agendas");
  agendas.getAll().forEach((agenda) => agenda.delete());
  const agenda = agendas.create({
    name: "Test",
    owner: lowan.id
  });

  // Création des données pour les événements
  const events = db.get("events");
  events.getAll().forEach((event) => event.delete());
  events.create({
    name: "Test",
    start: new Date(),
    end: new Date() + 3600000,
    agenda: agenda.id
  });
}
