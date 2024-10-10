import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Représente la structure d'un routeur.
 * Correspond à l'élément qui va gérer les routes.
 */
class Routeur {
  constructor() {
    this.router = Router();
    this.__dirname = path.dirname(fileURLToPath(import.meta.url));
    this.build();
  }

  /**
   * Récupère le chemin d'un fichier dans le dossier public
   * @param file {string} - Le nom du fichier
   * @returns {string} - Le chemin du fichier
   */
  getPathInHTML(file) {
    return path.join(this.__dirname, "../public/html/", file);
  }

  /**
   * Construit la route (à implémenter dans les classes enfants)
   */
  build() {
    throw new Error(
      "Oubli d'implémentation de la méthode 'main' dans une route !"
    );
  }
}

export default Routeur;
