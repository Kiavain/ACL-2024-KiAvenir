import jwt from "jsonwebtoken";
import { encryptPassword, getSecret } from "../utils/index.js";
import Controller from "./Controller.js";
import { access, unlink } from 'fs/promises';



// Fonction pour supprimer l'icone utilisateur lors de la suppression du compte
async function checkAndDeleteIcon(path) {
  try {
    await access(path); // Vérifie si le fichier existe
    await unlink(path); // Supprime le fichier
    console.log(`Le fichier ${path} a été supprimé avec succès.`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Le fichier ${path} n'existe pas.`);
    } else {
      console.error(`Erreur : ${err.message}`);
    }
  }
}


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
  }

  /**
   * Crée un compte utilisateur avec les informations du formulaire
   * @param req La requête
   * @param res La réponse
   * @returns {Promise<void>}
   */
  async createAccount(req, res) {
    const { email, username, password } = req.body;

    // Vérifie si les entrées de l'utilisateur sont valides
    const validationResult = this.validateUserInput(username, email, password);
    if (validationResult) {
      return this.creationCheck(res, validationResult, { email, username, password });
    }

    // Crée un nouvel utilisateur avec les informations du formulaire
    const createdUser = await this.database.get("users").create({ email, username, password });
    await this.createDefaultAgenda(createdUser.id);
    const token = await this.createJWT(createdUser);
    res.locals.user = token;
    res.cookie("accessToken", token, { httpOnly: true });
    req.flash("Votre compte a bien été créé, bienvenue " + username + ".");
    res.redirect("/");
  }

  /**
   * Crée un agenda par défaut pour un utilisateur
   * @param userId {number} L'identifiant de l'utilisateur
   * @returns {Promise<void>} Crée l'agenda par défaut
   */
  async createDefaultAgenda(userId) {
    await this.database.get("agendas").create({
      name: "Mon agenda",
      description: "Agenda par défaut",
      ownerId: userId,
      color: "#2196f3"
    });
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
   * Valide les entrées de l'utilisateur
   * @param username {string} Nom d'utilisateur
   * @param email {string} Adresse email
   * @param password {string} Mot de passe
   * @returns {boolean[] | null} Tableau d'états de validation ou null
   */
  validateUserInput(username, email, password) {
    const users = this.database.get("users");
    const usernameAlreadyTaken = users.some((u) => u.username === username);
    const emailAlreadyTaken = users.some((u) => u.email === email);
    const passwordTooShort = password.length < 8;

    return usernameAlreadyTaken || emailAlreadyTaken || passwordTooShort
      ? [usernameAlreadyTaken, emailAlreadyTaken, passwordTooShort]
      : null;
  }

  /**
   * Connecte un utilisateur avec les informations du formulaire
   * @param req La requête
   * @param res La réponse
   * @returns {Promise<void>}
   */
  async login(req, res) {
    const { username, password } = req.body;
    const user = this.database.get("users").find((user) => user.username === username);

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
   * @param req La requête
   * @param res La réponse
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
   * @param req La requête
   * @param res La réponse
   * @returns {Promise<void>}
   */
  async editAccount(req, res) {
    // Vérifie si l'utilisateur est connecté
    const localUser = res.locals.user;
    if (!localUser) {
      return res.status(401).redirect("/401");
    }

    // Récupère l'utilisateur connecté dans la base de données
    const user = this.database.get("users").get(localUser.id);
    const { email, username, password } = req.body;

    // Vérifie si les entrées de l'utilisateur sont valides
    const { isUsernameTaken, isEmailTaken } = this.checkForDuplicates(email, username, user);
    if (isUsernameTaken || isEmailTaken) {
      return this.renderDuplicateError(res, email, username, isUsernameTaken, isEmailTaken);
    }

    // Modifie les informations de l'utilisateur si des changements ont été effectués
    const updatedUser = this.prepareUpdatedUser(user, email, username, password);
    await this.updateUserAccount(res, user, updatedUser);
  }

  /**
   * Vérifie les doublons pour le nom d'utilisateur et l'email
   * @param email L'email
   * @param username Le nom d'utilisateur
   * @param user L'utilisateur
   * @returns {{isUsernameTaken: boolean, isEmailTaken: boolean}} Les doublons
   */
  checkForDuplicates(email, username, user) {
    const users = this.database.get("users");
    return {
      isUsernameTaken: users.some((u) => u.username === username && u.username !== user.username),
      isEmailTaken: users.some((u) => u.email === email && u.email !== user.email)
    };
  }

  /**
   * Prépare l'objet utilisateur avec les modifications
   * @param user L'utilisateur
   * @param email Le nouvel email
   * @param username Le nouveau nom d'utilisateur
   * @param password Le nouveau mot de passe
   */
  prepareUpdatedUser(user, email, username, password) {
    return {
      email: email !== user.email ? email : user.email,
      username: username !== user.username ? username : user.username,
      password: password ? encryptPassword(password, user.salt) : user.password
    };
  }

  /**
   * Met à jour le compte utilisateur
   * @param res La réponse
   * @param user L'utilisateur
   * @param updatedUser Les nouvelles données
   */
  async updateUserAccount(res, user, updatedUser) {
    try {
      await user.update(updatedUser);
      const updatedToken = await this.createJWT(user);
      res.cookie("accessToken", updatedToken, { httpOnly: true });
      res.locals.user = updatedToken;
      return res.redirect("/");
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
   * @param res La réponse
   * @param email L'email
   * @param username Le nom d'utilisateur
   * @param isUsernameTaken Si le nom d'utilisateur est déjà pris
   * @param isEmailTaken Si l'email est déjà
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
   */
  renderError(res, email, username, errorMessage) {
    return res.render("account", { errorMessage, email, username });
  }

  /**
   * Supprime le compte de l'utilisateur connecté
   * @param req La requête
   * @param res La réponse
   * @returns {Promise<void>}
   */
  async deleteAccount(req, res) {
    // Vérifie si l'utilisateur est connecté
    const localUser = res.locals.user;
    if (!localUser) {
      return res.status(401).redirect("/401");
    }

    try {
      // Supprime l'utilisateur et le déconnecte
      const user = this.database.get("users").get(localUser.id);

      // Supprime l'avatar s'il existe
      const filePath = `${process.cwd()}/src/public/img/user_icon/` + user.id + ".jpg";
      checkAndDeleteIcon(filePath);

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
   * @param req La requête
   * @param res La réponse
   */
  renderSignin(req, res) {
    res.render("signin", { title: "Inscription" });
  }

  /**
   * Rend la page de connexion
   * @param req La requête
   * @param res La réponse
   * @returns {void}
   *
   */
  renderLogin(req, res) {
    res.render("login", { title: "Connexion" });
  }

  /**
   * Rend la page de compte utilisateur
   * @param req La requête
   * @param res La réponse
   * @returns {*}
   */
  renderAccount(req, res) {
    if (!res.locals.user) {
      return res.status(401).redirect("/401");
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
}
