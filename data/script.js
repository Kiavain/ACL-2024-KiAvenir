/**
 * Construit la base de données de développement
 * @param server {KiAvenir} Le serveur
 */
export async function devDatabase(server) {
  const db = server.database.tables;

  // Création des données pour les utilisateurs
  const users = db.get("users");
  for (const user of users.getAll()) {
    await user.delete();
  }
  const lowan = await users.create({
    username: "test",
    password: "test",
    email: "test@test.com"
  });

  // Création des données pour les agendas
  const agendas = db.get("agendas");
  for (const agenda1 of agendas.getAll()) {
    await agenda1.delete();
  }
  const agenda = await agendas.create({
    name: "Test",
    ownerId: lowan.id
  });

  // Création des données pour les événements
  const events = db.get("events");
  for (const event of events.getAll()) {
    await event.delete();
  }
  await events.create({
    name: "Test - Sur plusieurs jours",
    description: "Ceci est un événement sur plusieurs jours",
    startDate: new Date(Date.now()),
    endDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    agendaId: agenda.agendaId
  });

  await events.create({
    name: "Test - Un jour",
    description: "Ceci est un événement sur une seule journée",
    startDate: new Date(Date.now()),
    endDate: new Date(Date.now() + 30 * 60 * 1000),
    agendaId: agenda.agendaId
  });
}
