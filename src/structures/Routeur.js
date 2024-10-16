import { Router } from "express";
import path from "path";
import { getDirname } from "../utils/index.js";

/**
 * Représente la structure d'un routeur.
 * Correspond à l'élément qui va gérer les routes.
 */
class Routeur {
  /**
   * Construit le routeur
   * @param server {KiAvenir} L'instance du serveur
   * @param controller {Controller | AccountController} Le contrôleur associé
   * @constructor
   */
  constructor(server, controller) {
    this.router = Router();
    this.server = server;
    this.controller = controller;
    this.build();
  }

  /**
   * Récupère le chemin d'un fichier dans le dossier public
   * @param file {string} Le nom du fichier
   * @returns {string} Le chemin du fichier
   */
  getPathInHTML(file) {
    const __dirname = getDirname(import.meta.url);
    return path.join(__dirname, "../public/html/", file);
  }

  /**
   * Construit la route (à implémenter dans les classes enfants)
   */
  build() {
    throw new Error("Oubli d'implémentation de la méthode 'build' dans une route !");
  }
}

export default Routeur;
