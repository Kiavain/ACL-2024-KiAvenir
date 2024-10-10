import KiAvenir from "./src/server.js";

const app = new KiAvenir();
app.start().catch(console.error);
