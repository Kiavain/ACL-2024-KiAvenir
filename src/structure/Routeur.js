import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

class Routeur {
  constructor() {
    this.router = Router();
    this.__dirname = path.dirname(fileURLToPath(import.meta.url));
    this.build();
  }

  getPathInHTML(file) {
    return path.join(this.__dirname, "../public/html/", file);
  }

  build() {
    throw new Error(
      "Oubli d'implémentation de la méthode 'main' dans une route !"
    );
  }
}

export default Routeur;
