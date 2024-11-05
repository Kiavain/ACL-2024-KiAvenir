import { addColors, createLogger, format, transports } from "winston";
import * as fs from "fs/promises";
import path from "path";
import jetpack from "fs-jetpack";
import { fileURLToPath } from "url";

// Obtenir __dirname en mode ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { existsAsync } = jetpack;

/**
 * Classe de gestion des logs
 */
export default class KiLogger {
  /**
   * Crée un logger
   */
  constructor() {
    this.winston = null;
  }

  /**
   * Load logger
   * @returns {Promise<void>}
   */
  async load() {
    const latestLogFilepath = path.resolve(__dirname, "../logs/latest.log");
    const latestLogExist = await existsAsync(latestLogFilepath);

    if (latestLogExist) {
      const stat = await fs.stat(latestLogFilepath);
      const parsedDate = parseDate(stat.ctime);
      const pathLogs = path.join(__dirname, "../logs/", `${parsedDate.year}-${parsedDate.month}-${parsedDate.day}`);
      const pathLogsExist = await existsAsync(pathLogs);
      if (!pathLogsExist) {
        await fs.mkdir(pathLogs, { recursive: true });
      }
      await fs.copyFile(latestLogFilepath, path.join(pathLogs, `KiAvenir-${stat.ctimeMs}.log`));
      await fs.access(latestLogFilepath);
      await fs.unlink(latestLogFilepath);
    }

    const opt = {
      filename: latestLogFilepath,
      json: false
    };

    // Définir les niveaux personnalisés
    const customLevels = {
      levels: {
        error: 0,
        warn: 1,
        success: 2,
        info: 3,
        debug: 5
      },
      colors: {
        error: "red",
        warn: "yellow",
        success: "green",
        info: "blue",
        debug: "magenta"
      }
    };

    addColors(customLevels.colors);

    // Aucun transport de fichier sur Windows
    let transportsArray = [new transports.File(opt), new transports.Console({ level: "debug" })];
    if (process.platform === "win32" || process.platform === "win64") {
      transportsArray = [new transports.Console({ level: "debug" })];
    }

    this.winston = createLogger({
      levels: customLevels.levels,
      format: format.combine(
        format.timestamp({ format: "DD/MM/YYYY à HH:mm:ss" }),
        format.printf((info) => {
          return `${info.timestamp} | KiAvenir - ${info.level.toUpperCase()} » ${info.message}`;
        }),
        format.colorize({ all: true })
      ),
      transports: transportsArray
    });
  }

  /**
   * Un message de débogage
   * @param {String} message le message de débogage
   */
  debug(message) {
    this.winston.debug(message);
  }

  /**
   * Log un message d'avertissement
   * @param {String} message le message d'avertissement
   */
  warn(message) {
    this.winston.warn(message);
  }

  /**
   * Log un message d'information
   * @param {String} message le message d'information
   */
  info(message) {
    this.winston.info(message);
  }

  /**
   * Log une erreur
   * @param message {Error | String} le message d'erreur
   * @param err {Error} l'erreur
   */
  error(message, err = null) {
    if (!err) {
      this.winston.error(message.stack || message);
    } else {
      this.winston.error(message + "\n" + err.stack);
    }
  }

  /**
   * Log un message de succès
   * @param {String} message le message de succès
   */
  success(message) {
    this.winston.success(message);
  }
}

/**
 * Parse la date
 * @param date {Date} La date
 * @returns {{year: number, month: number, day: string}}
 */
function parseDate(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();

  return { year, month, day };
}