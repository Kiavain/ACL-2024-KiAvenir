import jwt from "jsonwebtoken";
import { encryptPassword, getSecret } from "../utils/index.js";
import Controller from "./Controller.js";

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
    req.flash("notifications", "Votre compte a bien été créé, bienvenue " + username + ".");
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
      req.flash("notifications", "Bienvenue à vous " + user.username + ".");
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
      return res.render("401");
    }

    res.cookie("accessToken", null, { httpOnly: true });
    res.clearCookie("accessToken");
    res.locals.user = null;
    req.flash("notifications", "Déconnexion réussie.");
    res.redirect("/");
  }

  /**
   * Modifie les informations du compte de l'utilisateur connecté
   * @param req La requête
   * @param res La réponse
   * @returns {Promise<void>}
   */
  async editAccount(req, res) {
    // Vérifie si l'utilisateur est connecté
    if (!res.locals.user) {
      return res.render("401");
    }

    // On récupère les nouvelles informations envoyées par l'utilisateur
    const { email, username, password } = req.body;

    /**
     * L'utilisateur connecté
     * @type {Object}
     */
    const localUser = res.locals.user;

    // On cherche cet utilisateur dans la base de données
    const users = this.database.get("users");
    let user = users.find((user) => user.email === localUser.email);

    if (!user) {
      return res.render("account", {
        errorMessage: "Il y a eu un problème dans l'enregistrement de vos modifications.",
        email: email,
        username: username
      });
    }

    // Vérifie si le nouveau pseudo est déjà existant
    const usernameAlreadyTaken = users.find((u) => u.username === username && u.username !== localUser.username);
    const emailAlreadyTaken = users.find((u) => u.email === email && u.email !== localUser.email);

    // On empêche bien sûr de changer de pseudo ou de mail pour un déjà existant
    if (usernameAlreadyTaken) {
      return res.render("account", {
        usernameTaken: "Ce nom d'utilisateur est déjà pris.",
        email: email,
        username: username
      });
    } else if (emailAlreadyTaken) {
      return res.render("account", {
        emailTaken: "Un compte existe déjà pour cette adresse mail.",
        email: email,
        username: username
      });
    } else {
      let userIsUpdated = false;

      const newUser = {
        email: user.email,
        username: user.username,
        password: user.password
      };

      if (email !== user.email) {
        newUser.email = email;
        userIsUpdated = true;
      }
      if (username !== user.username) {
        newUser.username = username;
        userIsUpdated = true;
      }
      if (password !== "" && !user.checkPassword(password)) {
        newUser.password = encryptPassword(password, user.salt);
        userIsUpdated = true;
      }

      if (userIsUpdated) {
        try {
          await user.update(newUser);
          const u = users.find((u) => u.email === newUser.email);

          // Générer un nouveau token JWT avec les informations mises à jour
          const newToken = await this.createJWT(u);
          res.cookie("accessToken", newToken, { httpOnly: true });

          // Mettre à jour res.locals.user avec les informations actualisées
          res.locals.user = newToken;

          res.redirect("/");
        } catch {
          return res.render("account", {
            errorMessage: "Il y a eu un problème dans l'enregistrement de vos modifications.",
            email: email,
            username: username
          });
        }
      }
    }
  }

  /**
   * Supprime le compte de l'utilisateur connecté
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async deleteAccount(req, res) {
    // Vérifie si l'utilisateur est connecté
    if (!res.locals.user) {
      return res.render("401");
    }

    const localUser = res.locals.user;
    const user = this.database.get("users").find((user) => user.username === localUser.username);

    try {
      await user.delete(); // Supprime l'utilisateur de la base de données
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
   * @returns {void}
   */
  renderAccount(req, res) {
    const page = !res.locals.user ? "401" : "account";
    res.render(page);
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
