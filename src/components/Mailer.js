import nodeMailer from "nodemailer";
import fs from "fs";
import path from "path";
import { getDirname } from "../utils/index.js";
import dotenv from "dotenv";

export default class Mailer {
  constructor(server) {
    const mailEnv = dotenv.config({ path: "./mail.env" }).parsed;
    console.log(process.env.EMAIL);
    console.log(process.env.EMAIL_PASSWORD);

    this.server = server;
    this.transport = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: mailEnv.EMAIL,
        pass: mailEnv.EMAIL_PASSWORD
      }
    });
  }

  sendResetPasswordEmail(user, token) {
    let htmlFile = path.join(getDirname(import.meta.url), "../mail/reset_password.html");
    let html = fs.readFileSync(htmlFile, "utf8");

    html = html
      .replaceAll("{{token}}", token)
      .replaceAll("{{email}}", user.email)
      .replaceAll("{{address}}", this.server.ADDRESS)
      .replaceAll("{{port}}", this.server.PORT)
      .replaceAll("{{username}}", user.username);

    const mailOptions = {
      from: `KiAvenir <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: html
    };

    console.log(html);
    return this.transport.sendMail(mailOptions);
  }
}
