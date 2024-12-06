import request from "supertest";
import KiAvenir from "../src/server.js";

const kiAvenir = new KiAvenir();
await kiAvenir.initRoutes();

let server = kiAvenir.app;

// Créer un identifiant basé sur le moment
const id = Date.now();

describe("Test - Page d'accueil", () => {
  test("Rendu de la page d'accueil", async () => {
    const res = await request(server).get("/");
    expect(res.header['content-type']).toBe('text/html; charset=utf-8');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("KiAvenir")
  });
});

describe("Test - Partie Compte Utilisateur", () => {
  test("Création d'un compte avec données valides", async () => {
    const res = await request(server)
      .post("/account/new")
      .send({ email: `${id}@example.com`, username: `${id}`, password: "password123" });

    expect(res.statusCode).toBe(302);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.header["content-type"]).toMatch(/text\/plain/);
    expect(res.body).toEqual({});

    // Apparaît sur la page d'accueil
    expect(res.text).toContain("Found. Redirecting to /");
  });

  test("Déconnexion de l'utilisateur", async () => {
    const res = await request(server).post("/account/logout");
    expect(res.statusCode).toBe(302);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.header["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("Found. Redirecting to /");
  });

  test("Connexion de l'utilisateur", async () => {
    const res = await request(server)
      .post("/account/login")
      .send({ username: `${id}`, password: "password123" });

    expect(res.statusCode).toBe(302);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.header["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("Found. Redirecting to /");
  });

  test("Connexion de l'utilisateur (invalide", async () => {
    const res = await request(server)
      .post("/account/login")
      .send({ username: `${id}`, password: "password" });

    expect(res.statusCode).toBe(200);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.header["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Nom d&#39;utilisateur/mot de passe incorrect.");
  });

  test("Affichage - Mots de passe oublié", async () => {
    const res = await request(server).get("/forget-password");
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain("forget-password");
  });

  test("Affichage - Réinitialisation de mots de passe", async () => {
    const res = await request(server).get("/reset-password");
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain("Votre lien de réinitialisation a expiré.");
  });

  test("Création d'un compte avec données invalides", async () => {
    const res = await request(server)
      .post("/account/new");

    expect(res.statusCode).toBe(200);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.header["content-type"]).toMatch(/text\/html/);
    expect(res.body).toEqual({});

    // Reste sur la page d'inscription
    expect(res.text).toContain("Inscription");
  });

  test("Affichage - Paramètre du compte (déconnecté)", async () => {
    const res = await request(server).get("/account");
    expect(res.statusCode).toBe(302);
    expect(res.header['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain("401");
  })

  test("Affichage - Page de connexion", async () => {
    const res = await request(server).get("/login");
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain("login");
  });

});

