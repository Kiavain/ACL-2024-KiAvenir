import express from "express";
import bodyParser from "body-parser";
import * as fs from "node:fs";
import Database from "./components/Database.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { devDatabase } from "../data/script.js";
import session from "express-session";
import flash from "connect-flash";
import KiLogger from "./components/KiLogger.js";
import { getSecret } from "./utils/index.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Charge les variables d'environnement
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
    this.logger = new KiLogger(this);
  }

  /**
   * Initialise l'application
   * @returns {Promise<void>} Une promesse
   */
  async init() {
    this.app
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({ extended: true }))
      .use(express.static(path.join(__dirname, "public")))
      .use((req, res, next) => {
        res.locals.currentPath = req.path; // Pour récupérer l'url local (sert notamment pour la navbar).
        next();
      })
      .use(this.authenticate.bind(this));

    // Initialisation du logger
    await this.logger.load();

    // Initialisation de la base de données
    await this.database.load();
    if (process.env.NODE_ENV === "development") {
      await devDatabase(this);
    }
    this.logger.success("Base de données chargée !");

    await this.initNotifs();
  }

  /**
   * Initialise les notifications
   * @returns {Promise<void>} Une promesse
   */
  async initNotifs() {
    // Configurer la session
    this.app
      .use(
        session({
          secret: await getSecret(this.logger, "SESSION_SECRET"),
          resave: false,
          saveUninitialized: true
        })
      )
      // Configurer connect-flash
      .use(flash())
      .use((req, res, next) => {
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
      this.logger.success(`Route ${file} chargée !`);
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
      .use((req, res, next) => {
        const start = Date.now();

        res.on("finish", () => {
          const duration = Date.now() - start;
          const statusCode = res.statusCode;

          if (statusCode >= 500) {
            this.logger.error(`${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`, err);
          } else if (statusCode >= 400) {
            this.logger.warn(`${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`);
          } else {
            this.logger.info(`${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`);
          }
        });

        next();
      })
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
      this.logger.success(`Serveur en cours d'exécution : http://localhost:${this.PORT}`);
    });
  }

  /**
   * Parse les cookies
   * @param request La requête
   * @returns {{}} Les cookies
   */
  parseCookies(request) {
    const cookies = {};
    const cookieHeader = request.headers["cookie"];

    // Retourne un objet vide si aucun cookie n'est présent
    if (!cookieHeader) {
      return cookies;
    }

    // Traite chaque cookie
    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...rest] = cookie.split("=");
      const trimmedName = name?.trim();
      const value = rest.join("=").trim();

      // Ajoute le cookie au résultat s'il a un nom et une valeur
      if (trimmedName) {
        cookies[trimmedName] = decodeURIComponent(value || "");
      }
    });

    return cookies;
  }

  /**
   * Middleware d'authentification
   * @param req La requête
   * @param res La réponse
   * @param next La fonction suivante
   * @returns {Promise<void>}
   */
  async authenticate(req, res, next) {
    const cookies = this.parseCookies(req);
    res.locals.user = null;

    // Vérifie si un cookie accessToken est présent
    const token = cookies["accessToken"];
    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, await getSecret(this.logger, "JWT_SECRET"));
      const user = this.database.tables.get("users").get(payload.id);
      if (user) {
        res.locals.user = payload;
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'authentification :", error);
    }

    next();
  }
}

export default KiAvenir;
