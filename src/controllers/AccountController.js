import jwt from "jsonwebtoken";
import { encryptPassword, getSecret } from "../utils/index.js";
import Controller from "./Controller.js";
import { access, unlink } from "fs/promises";
import fs from "fs";
import path from "path";
import * as ICAL from "ical.js";
import { fileURLToPath } from "url";

/**
 * Typage des options des requêtes
 * @typedef {import("express").Request & {flash: (message: string) => void}} Request
 */

/**
 * Typage des options des réponses
 * @typedef {import("express").Response & {
 * success: (message: String, opt: Object = {}) => void,
 * err: (statusCode: int, message: String, opt: Object = {}) => void}
 * } Response
 */

/**
 * Typage de l'utilisateur
 * @typedef {import("../entities/structures/User").default} User
 */

/**
 * Contrôleur pour les comptes utilisateurs
 * @extends Controller
 */
export class AccountController extends Controller {
  /**
   * Crée un contrôleur pour les comptes utilisateurs
   * @param server {KiAvenir} Le serveur
   */
  constructor(server) {
    super(server);
    this.createAccount = this.createAccount.bind(this);
    this.login = this.login.bind(this);
    this.editAccount = this.editAccount.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.renderResetPassword = this.renderResetPassword.bind(this);
    this.forgetPassword = this.forgetPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.editUserIcon = this.editUserIcon.bind(this);
  }

  /**
   * Affiche la page de demande de réinitialisation de mot de passe
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async renderForgetPassword(req, res) {
    res.render("forget-password");
  }

  /**
   * Affiche la page de réinitialisation de mot de passe
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async renderResetPassword(req, res) {
    const { token, email } = req.query;
    const user = await this.getUser(email);

    // Vérifie si le token est valide
    if (!user || !user.checkResetToken(token)) {
      return res.render("errors/bad_token");
    }

    return res.render("reset-password", { token, email });
  }

  /**
   * Réinitialise le mot de passe de l'utilisateur
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async resetPassword(req, res) {
    const { password, email } = req.body;

    // Récupère l'utilisateur par son email et met à jour le mot de passe
    const user = await this.getUser(email);
    await user.update({ password: encryptPassword(password, user.salt), reset_token: "" });

    res.cookie("notification", "Le mot de passe a bien été réinitialisé.", { maxAge: 5000 });
    res.json({ success: true });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe à l'utilisateur
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async forgetPassword(req, res) {
    const { email } = req.body;
    const user = await this.getUser(email);

    // Vérifie si l'utilisateur existe
    if (user === undefined) {
      return res.err(404, "Vous allez recevoir un courriel si un compte est lié à cette adresse.");
    }

    // Vérifie si l'utilisateur a déjà demandé une réinitialisation de mot de passe
    const lastUpdate = new Date(user.updatedAt).getTime();
    const now = new Date().getTime();
    if (now - lastUpdate < 15000) {
      return res.err(
        429,
        `Veuillez patienter ${Math.ceil((15000 - (now - lastUpdate)) / 1000)} secondes avant de réessayer.`
      );
    }

    // Génère le token de réinitialisation de mot de passe
    await user.resetPassword();

    // Envoi du mail de réinitialisation de mot de passe
    await this.server.mailer.sendResetPasswordEmail(user, user.reset_token);
    return res.success("Vous allez recevoir un courriel si un compte est lié à cette adresse.");
  }

  /**
   * Crée un compte utilisateur avec les informations du formulaire
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async createAccount(req, res) {
    const { email, username, password } = req.body;

    // Vérifie si les entrées de l'utilisateur sont valides
    const validationResult = this.validateUserInput(username, email, password);
    if (validationResult.some((e) => e)) {
      return this.creationCheck(res, validationResult, { email, username, password });
    }

    /**
     * L'utilisateur créé
     * @type {User}
     */
    const createdUser = await this.users.create({ email, username, password });

    // Crée les agendas par défaut pour l'utilisateur
    await this.createDefaultAgenda(createdUser.id);
    await this.holidayAgenda(createdUser.id);

    // Connecte l'utilisateur et redirige vers la page d'accueil
    const token = await this.createJWT(createdUser);
    res.locals.user = token;
    res.cookie("accessToken", token, { httpOnly: true });
    req.flash("Votre compte a bien été créé, bienvenue " + username + ".");
    res.redirect("/");
  }

  /**
   * Vérifie les états de création du compte utilisateur
   * @param res {Response} La réponse
   * @param states {boolean[]} Tableau d'états
   * @param opt {Object} Options
   * @returns {void} Rend la vue de création de compte
   */
  creationCheck(res, states, opt) {
    const [usernameAlreadyTaken, emailAlreadyTaken, passwordTooShort] = states;

    // Messages d'erreur associés aux états
    const errorMessages = {
      usernameTaken: usernameAlreadyTaken ? "Ce nom d'utilisateur est déjà pris." : undefined,
      emailTaken: emailAlreadyTaken ? "Un compte existe déjà pour cette adresse mail." : undefined,
      passwordTooShort: passwordTooShort ? "Le mot de passe doit contenir au moins 8 caractères." : undefined
    };

    // Filtrer les messages d'erreur définis et les ajouter à opt
    Object.entries(errorMessages).forEach(([key, message]) => {
      if (message) {
        opt[key] = message;
      }
    });

    res.render("signin", opt);
  }

  /**
   * Connecte un utilisateur avec les informations du formulaire
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async login(req, res) {
    const { username, password } = req.body;

    /**
     * Les utilisateurs
     * @type {User[]}
     */
    const users = this.users.getAll();
    const user = users.find((user) => user.username === username);

    // On re-hash le mot de passe (avec sel cette fois) via l'entité "User" (comme à la création de compte)
    if (user && user.checkPassword(password)) {
      const token = await this.createJWT(user);
      res.locals.user = token;
      res.cookie("accessToken", token, { httpOnly: true });
      req.flash("Bienvenue à vous " + user.username + ".");
      res.redirect("/");
    } else {
      res.render("login", {
        username: username,
        errorMessage: "Nom d'utilisateur/mot de passe incorrect."
      });
    }
  }

  /**
   * Déconnecte l'utilisateur
   * @param req {Request} La requête
   * @param res {Response} La réponse
   */
  logout(req, res) {
    // Vérifie si l'utilisateur est connecté
    if (!res.locals.user) {
      return res.status(401).redirect("/401");
    }

    res.cookie("accessToken", null, { httpOnly: true });
    res.clearCookie("accessToken");
    res.locals.user = null;
    req.flash("Déconnexion réussie.");
    res.redirect("/");
  }

  /**
   * Modifie les informations du compte de l'utilisateur connecté.
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async editAccount(req, res) {
    // Vérifie si l'utilisateur est connecté
    const localUser = res.locals.user;
    if (!localUser) {
      return res.status(401).redirect("/401");
    }

    /**
     * L'utilisateur
     * @type {User}
     */
    const user = this.users.get(localUser.id);
    const { email, username, password } = req.body;

    // Vérifie si les entrées de l'utilisateur sont valides
    const { isUsernameTaken, isEmailTaken } = this.checkForDuplicates(email, username, user);
    if (isUsernameTaken || isEmailTaken) {
      return this.renderDuplicateError(res, email, username, isUsernameTaken, isEmailTaken);
    }

    // Modifie les informations de l'utilisateur si des changements ont été effectués
    const updatedUser = this.prepareUpdatedUser(user, email, username, password);
    await this.updateUserAccount(req, res, user, updatedUser);
  }

  /**
   * Modifie l'avatar du compte de l'utilisateur connecté.
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async editUserIcon(req, res) {
    // Vérifie si l'utilisateur est connecté
    const localUser = res.locals.user;
    if (!localUser) {
      return res.status(401).redirect("/401");
    }

    try {
      const { file } = req;
      if (!file) {
        return res.status(400).send("Aucune image uploadée.");
      }

      // Fichier uploadé
      const newIconPath = file.path;

      // Supprime l'ancien avatar s'il existe
      const iconPath = `${process.cwd()}/src/public/img/user_icon/` + localUser.id + ".jpg";
      await this.checkAndDeleteIcon(iconPath);

      // Importe le nouvel avatar et supprime le fichier de "uploads"
      fs.copyFileSync(newIconPath, iconPath);
      await this.checkAndDeleteIcon(newIconPath);
      res.cookie("notification", "L'avatar a bien été modifié.", { maxAge: 5000 });
      res.status(200).send("L'avatar a bien été modifié.");
    } catch (error) {
      console.error(error);
      res.status(500).send("Erreur lors de l'upload de l'image.");
    }
  }

  /**
   * Met à jour le compte utilisateur
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @param user {User} L'utilisateur
   * @param data {Object} Les données
   */
  async updateUserAccount(req, res, user, data) {
    try {
      await user.update(data);
      const updatedToken = await this.createJWT(user);
      res.cookie("notification", "Vos modifications ont bien été enregistrées.", { maxAge: 5000 });
      res.cookie("accessToken", updatedToken, { httpOnly: true });
      res.locals.user = updatedToken;
      return res.redirect("/account");
    } catch (error) {
      this.logger.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      this.renderError(
        res,
        user.email,
        user.username,
        "Il y a eu un problème dans l'enregistrement de vos modifications."
      );
    }
  }

  /**
   * Affiche un message d'erreur pour les doublons
   * @param res {Response} La réponse
   * @param email {string} L'email
   * @param username {string} Le nom d'utilisateur
   * @param isUsernameTaken {boolean} Le nom d'utilisateur est-il déjà pris ?
   * @param isEmailTaken {boolean} L'email est-il déjà pris ?
   * @returns {void} Rend la vue de compte utilisateur
   */
  renderDuplicateError(res, email, username, isUsernameTaken, isEmailTaken) {
    return res.render("account", {
      usernameTaken: isUsernameTaken ? "Ce nom d'utilisateur est déjà pris." : undefined,
      emailTaken: isEmailTaken ? "Un compte existe déjà pour cette adresse mail." : undefined,
      email,
      username
    });
  }

  /**
   * Rend la page avec un message d'erreur général.
   * @param res {Response} La réponse
   * @param email {string} L'email
   * @param username {string} Le nom d'utilisateur
   * @param errorMessage {string} Le message d'erreur
   */
  renderError(res, email, username, errorMessage) {
    return res.render("account", { errorMessage, email, username });
  }

  /**
   * Supprime le compte de l'utilisateur connecté
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async deleteAccount(req, res) {
    // Vérifie si l'utilisateur est connecté
    const localUser = res.locals.user;
    if (!localUser) {
      return res.status(401).redirect("/401");
    }

    try {
      /**
       * L'utilisateur
       * @type {User}
       */
      const user = this.users.get(localUser.id);

      // Supprime l'avatar s'il existe
      const iconPath = `${process.cwd()}/src/public/img/user_icon/` + user.id + ".jpg";
      await this.checkAndDeleteIcon(iconPath);

      // Supprime l'utilisateur
      await user.delete();
      this.logout(req, res);
    } catch (err) {
      this.logger.error("Erreur lors de la suppression du compte :", err);
      res.render("account", {
        errorMessage: "Erreur: impossible de supprimer le compte."
      });
    }
  }

  /**
   * Rend la page d'inscription
   * @param req {Request} La requête
   * @param res {Response} La réponse
   */
  renderSignin(req, res) {
    res.render("signin", { title: "Inscription" });
  }

  /**
   * Rend la page de connexion
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {void}
   *
   */
  renderLogin(req, res) {
    const notification = req.cookies.notification;
    if (notification) {
      req.flash(notification);
      res.clearCookie("notification");
    }

    res.render("login", { title: "Connexion" });
  }

  /**
   * Rend la page de compte utilisateur
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {*}
   */
  renderAccount(req, res) {
    if (!res.locals.user) {
      return res.status(401).redirect("/401");
    }

    const notification = req.cookies.notification;
    if (notification) {
      req.flash(notification);
      res.clearCookie("notification");
    }

    res.render("account");
  }

  /**
   * Crée un token JWT pour un utilisateur
   * @param user {Object} L'utilisateur
   * @returns {Promise<String>} Le token JWT
   */
  async createJWT(user) {
    const jwtSecret = await getSecret(this.logger, "JWT_SECRET");
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    // Signe le token avec une clé secrète
    return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
  }

  /**
   * Récupère un utilisateur par son email
   * @param email {string} L'email de l'utilisateur
   * @returns {Promise<User>}
   */
  async getUser(email) {
    /**
     * Les utilisateurs
     * @type {User[]}
     */
    const users = this.users.getAll();
    return users.find((user) => user.email === email);
  }

  /**
   * Crée un agenda par défaut pour un utilisateur
   * @param userId {number} L'identifiant de l'utilisateur
   * @returns {Promise<void>} Crée l'agenda par défaut
   */
  async createDefaultAgenda(userId) {
    await this.agendas.create({
      name: "Mon agenda",
      description: "Agenda par défaut",
      ownerId: userId,
      color: "#2196f3"
    });
  }
  /**
   * Importer l'agenda des jours fériés de base
   * @param userId {number} L'identifiant de l'utilisateur
   * @returns {Promise<void>} Crée l'agenda de vacances par défaut
   */
  async holidayAgenda(userId) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, "../../data/holidays/Basic.ics");
    const fileContent = fs.readFileSync(filePath, "utf8");

    //Traite le fichier
    const parsedCalendar = ICAL.default.parse(fileContent);
    const comp = new ICAL.default.Component(parsedCalendar);
    const vevents = comp.getAllSubcomponents("vevent");
    const name = comp.getFirstPropertyValue("x-wr-calname");
    const color = "#0000FF";
    const summary = comp.getFirstPropertyValue("x-wr-caldesc");
    const agenda = await this.agendas.create({ name, description: summary, ownerId: userId, color, special: true });

    await this.importEvents(vevents, agenda.agendaId);
  }

  /**
   * Prépare l'objet utilisateur avec les modifications
   * @param user {User} L'utilisateur
   * @param email {String} Le nouvel email
   * @param username {String} Le nouveau nom d'utilisateur
   * @param password {String} Le nouveau mot de passe
   */
  prepareUpdatedUser(user, email, username, password) {
    return {
      email,
      username,
      password: password ? encryptPassword(password, user.salt) : user.password
    };
  }

  /**
   * Vérifie les doublons pour le nom d'utilisateur et l'email
   * @param email {string} L'email
   * @param username {string}Le nom d'utilisateur
   * @param user {User} L'utilisateur
   * @returns {{isUsernameTaken: boolean, isEmailTaken: boolean}} Les doublons
   */
  checkForDuplicates(email, username, user) {
    /**
     * Les utilisateurs
     * @type {User[]}
     */
    const users = this.users.getAll();
    return {
      isUsernameTaken: users.some((u) => u.username === username && u.username !== user.username),
      isEmailTaken: users.some((u) => u.email === email && u.email !== user.email)
    };
  }

  /**
   * Supprime l'avatar de l'utilisateur
   * @param path {string} Le chemin du fichier
   * @returns {Promise<void>}
   */
  async checkAndDeleteIcon(path) {
    try {
      await access(path); // Vérifie si le fichier existe
      await unlink(path); // Supprime le fichier
    } catch (err) {
      if (err.code === "ENOENT") {
        this.logger.warn(`Le fichier ${path} n'existe pas.`);
      } else {
        this.logger.error(`Erreur : ${err.message}`, err);
      }
    }
  }

  /**
   * Valide les entrées de l'utilisateur
   * @param username {string} Nom d'utilisateur
   * @param email {string} Adresse email
   * @param password {string} Mot de passe
   * @returns {boolean[]} Tableau d'états de validation ou null
   */
  validateUserInput(username, email, password) {
    /**
     * Les utilisateurs
     * @type {User[]}
     */
    const users = this.users.getAll();
    const usernameAlreadyTaken = users.some((u) => u.username === username);
    const emailAlreadyTaken = users.some((u) => u.email === email);
    const passwordTooShort = !password || password.length < 8;

    return [usernameAlreadyTaken, emailAlreadyTaken, passwordTooShort];
  }
}
