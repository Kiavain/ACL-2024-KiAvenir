import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Créer une application express
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Recréer __dirname dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Route principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/homepage.html"));
});

// Lance le serveur sur le port 3000
app.listen(PORT, () => {
  console.log(`Server is running : http://localhost:${PORT}`);
});
