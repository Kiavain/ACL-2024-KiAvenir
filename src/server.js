import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { getDirname } from "./utils/index.js";
import * as fs from "node:fs";

class KiAvenir {
  constructor() {
    this.app = express();
    this.PORT = 3000;
    this.routes = [];
  }

  init() {
    this.app.use(bodyParser.json());
    const dirname = getDirname(import.meta.url);
    this.app.use(express.static(path.join(dirname, "public")));
  }

  async buildRoutes() {
    this.init();
    // Récupère les routes dans le dossier routes
    for (const file of fs.readdirSync("src/routes")) {
      const route = await import(`./routes/${file}`);
      this.routes.push(route);
    }
  }

  async initRoutes() {
    await this.buildRoutes();

    for (const route of this.routes) {
      this.app.use(route.default);
    }
  }

  async start() {
    await this.initRoutes();
    this.app.listen(this.PORT, () => {
      console.log(`Server is running : http://localhost:${this.PORT}`);
    });
  }
}

export default KiAvenir;
