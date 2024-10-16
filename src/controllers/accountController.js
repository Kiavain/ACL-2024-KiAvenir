import jwt from "jsonwebtoken";
import { encryptPassword } from "../utils/index.js";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import { join } from "path";
import Controller from "./controller.js";

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
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async createAccount(req, res) {
    const { email, username, password } = req.body;

    // Récupère les utilisateurs de la base de données
    const users = this.database.get("users").getAll();

    const usernameAlreadyTaken = users.find((u) => u.username === username);
    const emailAlreadyTaken = users.find((u) => u.email === email);

    if (usernameAlreadyTaken) {
      return res.render("signin", {
        usernameTaken: "Ce nom d'utilisateur est déjà pris.",
        email: email,
        username: username
      });
    } else if (emailAlreadyTaken) {
      return res.render("signin", {
        emailTaken: "Un compte existe déjà pour cette adresse mail.",
        email: email,
        username: username
      });
    } else {
      const createdAt = Date.now();
      const updatedAt = createdAt;

      const newUser = {
        email,
        username,
        password,
        createdAt,
        updatedAt
      };

      const createdUser = await this.database.get("users").create(newUser);

      // On associe également un agenda par défaut à l'utilisateur
      const defaultAgenda = {
        name: "Mon agenda",
        description: "Agenda par défaut",
        ownerId: createdUser.id,
        color: "#2196f3",
        createdAt,
        updatedAt
      };

      // Ajoute l'utilisateur à la base
      await this.database.get("agendas").create(defaultAgenda);

      // Créer un token JWT
      const token = await createJWT(createdUser);
      res.locals.user = token;

      // Défini le token dans le cookie et redirige
      res.cookie("accessToken", token, { httpOnly: true });
      res.redirect("/");
    }
  }

  /**
   * Connecte un utilisateur avec les informations du formulaire
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async login(req, res) {
    const { username, password } = req.body;
    const user = this.database
      .get("users")
      .find((user) => user.username === username);

    // On re-hash le mot de passe (avec sel cette fois) via l'entité "User" (comme à la création de compte)
    if (user && user.checkPassword(password)) {
      const token = await createJWT(user);
      res.locals.user = token;
      res.cookie("accessToken", token, { httpOnly: true });
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
    res.cookie("accessToken", null, { httpOnly: true });
    res.clearCookie("accessToken");
    res.locals.user = null;
    res.redirect("/");
  }

  /**
   * Modifie les informations du compte de l'utilisateur connecté
   * @param req {Request} La requête
   * @param res {Response} La réponse
   * @returns {Promise<void>}
   */
  async editAccount(req, res) {
    // On récupère les nouvelles informations envoyées par l'utilisateur
    const { email, username, password } = req.body;

    // On récupère l'utilisateur connecté
    const localUser = res.locals.user;

    // On cherche cet utilisateur dans la base de données
    const users = this.database.get("users").getAll();
    let user = users.find((user) => user.email === localUser.email);

    if (!user) {
      return res.render("account", {
        errorMessage:
          "Il y a eu un problème dans l'enregistrement de vos modifications.",
        email: email,
        username: username
      });
    }

    // Vérifie si le nouveau pseudo est déjà existant
    const usernameAlreadyTaken = users.find(
      (u) => u.username === username && u.username !== localUser.username
    );
    const emailAlreadyTaken = users.find(
      (u) => u.email === email && u.email !== localUser.email
    );

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
          const u = this.database
            .get("users")
            .find((u) => u.email === newUser.email);

          // Générer un nouveau token JWT avec les informations mises à jour
          const newToken = await createJWT(u);
          res.cookie("accessToken", newToken, { httpOnly: true });

          // Mettre à jour res.locals.user avec les informations actualisées
          res.locals.user = newToken;

          res.redirect("/");
        } catch {
          return res.render("account", {
            errorMessage:
              "Il y a eu un problème dans l'enregistrement de vos modifications.",
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
    const localUser = res.locals.user;
    const user = this.database
      .get("users")
      .find((user) => user.username === localUser.username);

    try {
      await user.delete(); // Supprime l'utilisateur de la base de données
      this.logout(req, res);
    } catch (err) {
      console.error(err);
      res.render("account", {
        errorMessage: "Erreur: impossible de supprimer le compte."
      });
    }
  }

  renderSignin(req, res) {
    res.render("signin", { title: "Inscription" });
  }

  renderLogin(req, res) {
    res.render("login", { title: "Connexion" });
  }

  renderAccount(req, res) {
    res.render("account");
  }
}

const envFilePath = join(process.cwd(), ".env");
dotenv.config();

/**
 * Lit le contenu du fichier .env
 * @returns {Promise<String>} Le contenu du fichier .env ou une chaîne vide si le fichier n'existe pas
 */
async function readEnvFile() {
  try {
    return await fs.readFile(envFilePath, "utf-8");
  } catch {
    console.warn("Le fichier .env n'existe pas, il sera créé.");
    return "";
  }
}

/**
 * Écrit une nouvelle variable dans le fichier .env
 * @param key {String} Clé de la variable
 * @param value {String} Valeur de la variable
 * @returns {Promise<void>}
 */
async function appendEnvVariable(key, value) {
  try {
    let envContent = await readEnvFile();
    if (!envContent.includes(`${key}=`)) {
      envContent += `\n${key}=${value}\n`;
      await fs.writeFile(envFilePath, envContent, "utf-8");
    }
  } catch (err) {
    console.error("Erreur lors de la mise à jour du fichier .env :", err);
  }
}

/**
 * Récupère la clé secrète pour les JWT, en la générant si nécessaire
 * @returns {Promise<String>} Le secret JWT
 */
async function getSecret() {
  if (!process.env.JWT_SECRET) {
    const newSecret = randomBytes(64).toString("hex");
    await appendEnvVariable("JWT_SECRET", newSecret);
    process.env.JWT_SECRET = newSecret;
    console.warn("La clé secrète JWT a été générée et ajoutée au fichier .env");
  }
  return process.env.JWT_SECRET;
}

/**
 * Crée un token JWT pour un utilisateur
 * @param user {Object} L'utilisateur
 * @returns {Promise<String>} Le token JWT
 */
async function createJWT(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username
  };

  // Signe le token avec une clé secrète
  return jwt.sign(payload, await getSecret(), { expiresIn: "1h" });
}

/**
 * Parse les cookies d'une requête
 * @param request {Request} La requête
 * @returns {{}} Les cookies
 */
function parseCookies(request) {
  const list = {};
  const cookieHeader = request.headers["cookie"];
  if (!cookieHeader) {
    return list;
  }

  cookieHeader.split(";").forEach(function (cookie) {
    let [name, ...rest] = cookie.split("=");
    name = name?.trim();
    if (!name) {
      return;
    }
    const value = rest.join("=").trim();
    if (!value) {
      return;
    }
    list[name] = decodeURIComponent(value);
  });

  return list;
}

/**
 * Authentifie un utilisateur à partir d'un token JWT
 * @param req {Request} La requête
 * @param res {Response} La réponse
 * @param next {Function} La fonction suivante
 * @returns {function} La fonction suivante
 */
export function authenticate(req, res, next) {
  const cookies = parseCookies(req);

  try {
    const token = cookies["accessToken"];
    if (!token) {
      res.locals.user = null;
      return next();
    }
    res.locals.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.log("Erreur: aucun token d'accès trouvé dans le cookie\n", error);
  }
  next();
}
