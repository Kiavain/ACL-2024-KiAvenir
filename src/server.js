import express from "express";
import bodyParser from "body-parser";
import * as fs from "node:fs";
import Database from "./components/Database.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { authenticate } from "./controllers/accountController.js";
import { devDatabase } from "../data/script.js";
import session from "express-session";
import flash from "connect-flash";

// Permet de charger les variables d'environnement
import dotenv from "dotenv";
dotenv.config();

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
      .use(bodyParser.urlencoded({ extended: true })) // For form data (application/x-www-form-urlencoded)
      .use(express.static(path.join(__dirname, "public")))
      .use((req, res, next) => {
        res.locals.currentPath = req.path; // Pour récupérer l'url local (sert notamment pour la navbar).
        next();
      })
      .use(authenticate); // Permet de récupérer le token s'il existe (voir accountController.js)

    await this.database.load();
    if (process.env.NODE_ENV === "development") {
      await devDatabase(this);
    }
    await this.initNotifs();
    console.log("Base de données chargée !");
  }
  async initNotifs() {
    // Configurer la session
    this.app.use(
      session({
        secret: "secret-key", // Utilise une clé secrète pour signer la session
        resave: false,
        saveUninitialized: true
      })
    );
    // Configurer connect-flash
    this.app.use(flash());
    // Middleware pour rendre les flash messages accessibles dans les vues
    this.app.use((req, res, next) => {
      res.locals.notifications = req.flash("notifications");
      next();
    });
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
      res.status(404).render("errors/404.ejs");
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
