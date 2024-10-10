import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { getDirname } from "./utils/index.js";
import * as fs from "node:fs";
import Database from "./components/Database.js";

/**
 * Représente le serveur de l'application
 */
class KiAvenir {
  constructor() {
    this.app = express();
    this.PORT = 3000;
    this.routes = [];
    this.database = new Database(this);
  }

  /**
   * Initialisation du serveur
   */
  async init() {
    const dirname = getDirname(import.meta.url);
    this.app.use(bodyParser.json());
    this.app.use(express.static(path.join(dirname, "public")));
    this.app.set("views", path.join(dirname, "public/views"));
    this.app.set("view engine", "ejs");

    await this.database.load();
    console.log("Base de données chargée !");
  }

  /**
   * Construit les routes de l'application
   * @returns {Promise<void>} - Une promesse
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
   * @returns {Promise<void>} - Une promesse
   */
  async initRoutes() {
    await this.buildRoutes();

    for (const route of this.routes) {
      this.app.use(route.default);
    }
  }

  /**
   * Démarre le serveur
   * @returns {Promise<void>} - Une promesse
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
