import express from "express";
import * as fs from "node:fs";
import Database from "./components/Database.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
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
    this.redisClient = null;
  }

  /**
   * Initialise l'application
   * @returns {Promise<void>} Une promesse
   */
  async init() {
    this.app
      .use(express.json())
      .use(express.urlencoded({ extended: true }))
      .use((req, res, next) => {
        res.locals.currentPath = req.path;
        next();
      })
      .use(cookieParser())
      .use(this.authenticate.bind(this))
      .use(express.static(path.join(__dirname, "public")));

    try {
      // Chargement en parallèle du logger et de la base de données
      await Promise.all([this.logger.load(), this.database.load()]);
      this.logger.success("Base de données et logger chargés !");

      // Initialisation des notifications
      await this.initNotifs();
      this.logger.success("Notifications initialisées !");
    } catch (error) {
      this.logger.error("Erreur pendant l'initialisation de l'application :", error);
    }
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
      .use(this.flash);

    this.setupShutdown();
  }

  /**
   * Met en place la fermeture de l'application
   */
  setupShutdown() {
    // Fonction pour fermer proprement l'application
    const shutdown = async () => {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.info("Redis déconnecté proprement.");
      }
      process.exit(0);
    };

    // Écouter les signaux pour une fermeture propre
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("exit", shutdown);
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
      .set("views", this.getPath("views"))
      // Middleware pour logger les requêtes
      .use(this.expressLog.bind(this));

    // Utilisation des routes
    for (const route of this.routes) {
      this.app.use(route);
    }

    // Middleware pour gérer les erreurs 404
    this.app.use((req, res) => {
      res.status(404).redirect("/404");
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
   * Middleware d'authentification
   * @param req La requête
   * @param res La réponse
   * @param next La fonction suivante
   * @returns {Promise<void>}
   */
  async authenticate(req, res, next) {
    res.locals.user = null;

    // Vérifie si un cookie accessToken est présent
    const token = req.cookies["accessToken"];
    if (!token) {
      return next();
    }

    try {
      // Vérifie que le token est valide et correspond à un utilisateur valide également
      const payload = jwt.verify(token, await getSecret(this.logger, "JWT_SECRET"));
      const user = this.database.tables.get("users").get(payload.id);
      if (user) {
        res.locals.user = payload;
      }
    } catch {
      this.logger.error("Le token JWT de la session a expiré, la déconnexion est forcée.");
      res.clearCookie("accessToken");
    }

    next();
  }

  /**
   * Middleware de logging des requêtes
   * @param req La requête
   * @param res La réponse
   * @param next La fonction suivante
   * @returns {Promise<void>}
   */
  async expressLog(req, res, next) {
    const start = Date.now();

    // Log la requête à la fin de la réponse
    res.on("finish", () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const message = `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.info(message);
      }
    });

    next();
  }

  /**
   * Middleware pour les notifications flash
   * @param req La requête
   * @param res La réponse
   * @param next La fonction suivante
   */
  flash(req, res, next) {
    // Initialisation des notifications
    if (!req.session.flashMessages) {
      req.session.flashMessages = [];
    }

    // Fonctions pour les réponses
    res.err = (statusCode, message, opt = {}) => {
      const flashMessages = req.session.flashMessages;
      req.session.flashMessages = [];
      res.status(statusCode).json({ success: false, message, flashMessages, ...opt });
    };

    res.success = (message, opt = {}) => {
      req.flash(message);
      const flashMessages = req.session.flashMessages;
      req.session.flashMessages = [];
      res.status(200).json({ success: true, message, flashMessages, ...opt });
    };

    // Fonction pour ajouter des notifications
    req.flash = (message) => {
      req.session.flashMessages.push(message);
    };

    // Fonction pour récupérer les notifications dans les vues
    res.locals.getFlashMessages = () => {
      const flashMessages = req.session.flashMessages;
      req.session.flashMessages = [];
      return flashMessages;
    };

    next();
  }

  /**
   * Retourne le chemin complet d'un dossier
   * @param folder Le dossier
   * @returns {string} Le chemin complet
   */
  getPath(folder) {
    return path.join(__dirname, folder);
  }
}

export default KiAvenir;
