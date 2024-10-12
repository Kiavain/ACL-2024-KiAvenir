import express from "express";
import bodyParser from "body-parser";
import * as fs from "node:fs";
import Database from "./components/Database.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { devDatabase } from "../data/script.js";
import dotenv from "dotenv";

// Créez l'équivalent de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Classe principale de l'application
 */
class KiAvenir {
  /**
   * Crée une instance de l'application
   */
  constructor() {
    this.app = express();
    this.PORT = 3000;
    this.routes = [];
    this.database = new Database(this);
  }

  /**
   * Initialise l'application
   * @returns {Promise<void>} Une promesse
   */
  async init() {
    this.app
      .use(bodyParser.json())
      .use(express.static(path.join(__dirname, "public")));

    await this.database.load();
    console.log("Base de données chargée !");

    // Peuple la base de données de développement
    console.log("Environnement : ", process.env.NODE_ENV);
    if (process.env.NODE_ENV === "development") {
      await devDatabase(this);
    }
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
      const routeInstance = new route.default(this);
      console.log(`Route ${file} chargée !`);
      this.routes.push(routeInstance.router);
    }
  }

  /**
   * Initialise les routes de l'application
   * @returns {Promise<void>} Une promesse
   */
  async initRoutes() {
    await this.buildRoutes();

    // Dossier views avec view engine EJS
    this.app
      .set("view engine", "ejs")
      .set("views", path.join(__dirname, "views"))
      // Middleware pour logger les requêtes
      .use(morgan("dev"))
      // Middleware pour parser les cookies
      .use(cookieParser());

    // Utilisation des routes
    for (const route of this.routes) {
      this.app.use(route);
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
