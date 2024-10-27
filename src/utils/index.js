import { fileURLToPath } from "url";
import path, { join } from "path";
import crypto, { randomBytes } from "crypto";
import fs from "fs/promises";

const envFilePath = join(process.cwd(), ".env");

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

/**
 * Récupère une variable d'environnement secrète
 * @param logger {KiLogger} Le logger
 * @param key {string} La clé de la variable d'environnement
 * @returns {Promise<string>}
 */
async function getSecret(logger, key) {
  if (!process.env[key]) {
    const newSecret = randomBytes(64).toString("hex");
    await appendEnvVariable(logger, key, newSecret);
    process.env[key] = newSecret;
    logger.warn(`La variable d'environnement ${key} n'était pas définie, elle a été générée aléatoirement.`);
  }
  return process.env[key];
}

/**
 * Écrit une nouvelle variable dans le fichier .env
 * @param logger {KiLogger} Le logger
 * @param key {String} Clé de la variable
 * @param value {String} Valeur de la variable
 * @returns {Promise<void>}
 */
async function appendEnvVariable(logger, key, value) {
  try {
    let envContent = await readEnvFile(logger);
    if (!envContent.includes(`${key}=`)) {
      envContent += `${key}=${value}\n`;
      await fs.writeFile(envFilePath, envContent, "utf-8");
    }
  } catch (err) {
    logger.error("Erreur lors de la mise à jour du fichier .env :", err);
  }
}

/**
 * Lit le contenu du fichier .env
 * @returns {Promise<String>} Le contenu du fichier .env ou une chaîne vide si le fichier n'existe pas
 */
async function readEnvFile(logger) {
  try {
    return await fs.readFile(envFilePath, "utf-8");
  } catch {
    logger.warn("Le fichier .env n'existe pas, il sera créé.");
    return "";
  }
}

export { getDirname, encryptPassword, getSecret };
