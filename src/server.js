import express from "express";
import bodyParser from "body-parser";
import * as fs from "node:fs";
import Database from "./components/Database.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Créez l'équivalent de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class KiAvenir {
  constructor() {
    this.app = express();
    this.PORT = 3000;
    this.routes = [];
    this.database = new Database(this);
  }

  async init() {
    this.app
      .use(bodyParser.json())
      .use(express.static(path.join(__dirname, "public")));

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
      this.app.use(route.default);
    }

    // Middleware pour gérer les erreurs 404
    this.app.use((req, res) => {
      res.status(404).send("<h1>404 Not Found</h1>");
    });
  }

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