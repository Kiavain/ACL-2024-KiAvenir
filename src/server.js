import express from "express";
import bodyParser from "body-parser";
import * as fs from "node:fs";
import Database from "./components/Database.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";

/**
 * Représente le serveur de l'application
 */
class KiAvenir {
  /**
   * Construit le serveur de l'application
   * @constructor
   */
  constructor() {
    this.app = express();

    /**
     * Le port du serveur
     * @type {number} Le port du serveur
     */
    this.PORT = 3000;

    /**
     * Les routes de l'application
     * @type {Array<Object>}
     */
    this.routes = [];

    /**
     * La base de données de l'application
     * @type {Database}
     */
    this.database = new Database(this);
  }

  /**
   * Initialisation du serveur
   */
  async init() {
    this.app
      .use(bodyParser.json())
      .use(express.static(new URL("./public", import.meta.url).pathname));

    await this.database.load();
    console.log("Base de données chargée !");
  }

  /**
   * Construit les routes de l'application
   * @returns {Promise<void>} Une promesse
   */
  async buildRoutes() {
    await this.init();

    // Récupère les routes dans le dossier routes
    for (const file of fs.readdirSync("src/routes")) {
      const route = await import(`./routes/${file}`);
      this.routes.push(route);
    }
  }

  /**
   * Initialise les routes de l'application
   * @returns {Promise<void>} Une promesse
   */
  async initRoutes() {
    await this.buildRoutes();

    // Dossier views avec view  engine EJS
    this.app
      .set("view engine", "ejs")
      .set("views", new URL("./views", import.meta.url).pathname)
      // Middleware pour logger les requêtes
      .use(morgan("dev"))
      // Middleware pour parser les cookies
      .use(cookieParser());

    // Utilisation des routes
    for (const route of this.routes) {
      this.app.use(route.default);
    }

    // Middleware pour gérer les erreurs 404
    this.app.use((req, res) => {
      res.status(404).send("<h1>404 Not Found</h1>");
    });
  }

  /**
   * Démarre le serveur
   * @returns {Promise<void>} Une promesse
   */
  async start() {
    await this.initRoutes();
    this.app.listen(this.PORT, () => {
      console.log(
        `Serveur en cours d'exécution : http://localhost:${this.PORT}`
      );
    });
  }
}

export default KiAvenir;
