import { fileURLToPath } from "url";
import path from "path";

/**
 * Récupère le chemin du dossier du fichier
 * @param metaUrl {string} - L'url du fichier
 * @returns {string} - Le chemin du dossier
 */
function getDirname(metaUrl) {
  const __filename = fileURLToPath(metaUrl);
  return path.dirname(__filename);
}

export { getDirname };
