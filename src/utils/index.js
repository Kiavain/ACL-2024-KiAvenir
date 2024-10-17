import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

/**
 * Récupère le chemin du dossier du fichier
 * @param metaUrl {string} L'url du fichier
 * @returns {string} Le chemin du dossier
 */
function getDirname(metaUrl) {
  const __filename = fileURLToPath(metaUrl);
  return path.dirname(__filename);
}

/**
 * Chiffre un mot de passe
 * @param password {string} Le mot de passe à chiffrer
 * @param salt {string} Le sel du mot de passe
 * @returns {string} Le mot de passe chiffré
 */
function encryptPassword(password, salt) {
  const hash = crypto.createHmac("sha256", salt);
  hash.update(password);
  return hash.digest("hex");
}

export { getDirname, encryptPassword };
