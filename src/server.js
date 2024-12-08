import express from 'express';
import * as fs from 'node:fs';
import Database from './components/Database.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import session from 'express-session';
import KiLogger from './components/KiLogger.js';
import { getDirname, getSecret } from './utils/index.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Mailer from './components/Mailer.js';
import { WebSocketServer, WebSocket } from 'ws';

// Charge les variables d'environnement
dotenv.config();

// Créez l'équivalent de __dirname
const __dirname = getDirname(import.meta.url);

/**
 * Classe principale de l'application
 */
class KiAvenir {
  /**
   * Crée une instance de l'application
   */
  constructor() {
    this.app = express();
    this.ADDRESS = 'localhost';
    this.PORT = 3000;
    this.routes = [];
    this.database = new Database(this);
    this.logger = new KiLogger(this);
    this.mailer = new Mailer(this);
    this.wss = new WebSocketServer({ port: 8080 });
    this.server = null; // Instance du serveur Express

    // Libère les ressources lors des signaux d'arrêt
    process.on('SIGINT', this.stop.bind(this));
    process.on('SIGTERM', this.stop.bind(this));
  }

  /**
   * Méthode de fermeture propre
   */
  async stop() {
    try {
      this.logger.warn('Fermeture du serveur...');

      // Fermer les WebSockets
      if (this.wss) {
        this.wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.close(1001, 'Le serveur se ferme.');
          }
        });

        this.logger.info('WebSocketServer fermé.');
        this.wss.close();
      }

      // Fermer le serveur Express
      if (this.server) {
        await new Promise((resolve, reject) => {
          this.server.close((err) => {
            if (err) {
              this.logger.error('Erreur lors de la fermeture du serveur Express : ', err);
              return reject(err);
            }
            this.logger.info('Serveur Express fermé.');
            resolve();
          });
        });
      }

      // Fermer la base de données
      await this.database.connector.close();

      this.logger.info('Toutes les ressources ont été libérées. Au revoir !');
    } catch (error) {
      this.logger.error('Erreur lors de la fermeture : ', error);
    } finally {
      process.exit(0); // Quitter le processus proprement
    }
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
      .use(express.static(path.join(__dirname, 'public')));

    try {
      // Chargement en parallèle du logger et de la base de données
      await Promise.all([this.logger.load(), this.database.load()]);
      this.logger.success('Base de données et logger chargés !');

      // Initialisation des notifications
      await this.initNotifs();
      this.logger.success('Notifications initialisées !');
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
          secret: await getSecret(this.logger, 'SESSION_SECRET'),
          resave: false,
          saveUninitialized: true
        })
      )
      .use(this.flash);
  }

  /**
   * Construit les routes de l'application
   * @returns {Promise<void>} Une promesse
   */
  async buildRoutes() {
    await this.init();

    // Récupère les routes dans le dossier routes
    for (const file of fs.readdirSync('src/routes')) {
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
      .set('view engine', 'ejs')
      .set('views', this.getPath('views'))
      // Middleware pour logger les requêtes
      .use(this.expressLog.bind(this));

    // Utilisation des routes
    for (const route of this.routes) {
      this.app.use(route);
    }

    // Middleware pour gérer les erreurs 404
    this.app.use((req, res) => {
      res.status(404).redirect('/404');
    });
  }

  /**
   * Démarre le serveur
   * @returns {Promise<void>} Une promesse
   */
  async start() {
    await this.initRoutes();

    this.wss.on('connection', (ws) => {
      this.logger.success('Client connecté.');

      // Recevoir les messages des clients
      ws.on('message', (data) => {
        // Diffuser la mise à jour à tous les autres clients
        this.wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data); // Envoyer les données reçues
          }
        });
      });

      ws.on('close', () => {
        this.logger.warn('Client déconnecté.');
      });
    });

    this.logger.success("WebSocket à l'écoute sur le port 8080.");

    this.server = this.app.listen(this.PORT, () => {
      this.logger.success(`Serveur en cours d'exécution : http://${this.ADDRESS}:${this.PORT}`);
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
    const token = req.cookies['accessToken'];
    if (!token) {
      return next();
    }

    try {
      // Vérifie que le token est valide et correspond à un utilisateur valide également
      const payload = jwt.verify(token, await getSecret(this.logger, 'JWT_SECRET'));
      const user = this.database.tables.get('users').get(payload.id);
      if (user) {
        res.locals.user = payload;
      }
    } catch {
      this.logger.error('Le token JWT de la session a expiré, la déconnexion est forcée.');
      res.clearCookie('accessToken');
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
    res.on('finish', () => {
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
   * @param folder {string} Le dossier
   * @returns {string} Le chemin complet
   */
  getPath(folder) {
    return path.join(__dirname, folder);
  }
}

export default KiAvenir;
