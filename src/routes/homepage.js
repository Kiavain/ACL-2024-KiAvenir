import Routeur from "../structure/Routeur.js";

class HomepageRouteur extends Routeur {
  constructor() {
    super();
  }

  build() {
    this.router.get("/", (req, res) => {
      res.sendFile(this.getPathInHTML("homepage.html"));
    });
  }
}

const homepageRoute = new HomepageRouteur();
export default homepageRoute.router;
