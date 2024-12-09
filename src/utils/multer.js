import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configuration pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier des uploads
const uploadsDir = path.join(__dirname, '../..', 'uploads');

// Vérifie si le dossier 'uploads' existe, sinon le crée
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de stockage avec Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Utilise le chemin absolu vers le dossier uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Middleware Multer
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Vérifier que c'est bien une image
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error("Ce fichier n'est pas une image !"), false);
    }
    cb(null, true);
  }
});

export default upload;
