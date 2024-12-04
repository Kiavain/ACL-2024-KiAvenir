import nodeMailer from "nodemailer";
import fs from "fs";
import path from "path";
import { getDirname } from "../utils/index.js";
import dotenv from "dotenv";

/**
 * Typage de l'utilisateur
 * @typedef {import("../entities/structures/User.js").default} User
 */

const MAIL_ENV = dotenv.config({ path: "./mail.env" }).parsed;

/**
 * Représente le mailer
 */
export default class Mailer {
  /**
   * Construit le mailer
   * @param server {KiAvenir} Le serveur
   */
  constructor(server) {
    this.server = server;
    this.transport = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_ENV.EMAIL,
        pass: MAIL_ENV.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Envoie un mail pour réinitialiser le mot de passe
   * @param user {User} L'utilisateur
   * @param token {String} Le token de réinitialisation
   * @returns {*}
   */
  async sendResetPasswordEmail(user, token) {
    // Récupère le chemin du fichier de template
    const htmlFile = path.join(getDirname(import.meta.url), "../mail/reset_password.html");

    // Récupère le contenu du fichier de template en remplaçant les variables
    const html = fs
      .readFileSync(htmlFile, "utf8")
      .replaceAll("{{token}}", token)
      .replaceAll("{{email}}", user.email)
      .replaceAll("{{address}}", this.server.ADDRESS)
      .replaceAll("{{port}}", this.server.PORT)
      .replaceAll("{{username}}", user.username);

    // Envoie le mail
    await this.transport.sendMail({
      from: `KiAvenir <${MAIL_ENV.EMAIL}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html
    });
  }
}
