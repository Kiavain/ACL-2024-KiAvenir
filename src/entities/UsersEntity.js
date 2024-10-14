import Entity from "../structures/Entity.js";
import User from "./structures/User.js";
import { DataTypes } from "sequelize";
import { encryptPassword } from "../utils/index.js";
import crypto from 'crypto';


/**
 * Représente l'entité des utilisateurs
 */
export default class UsersEntity extends Entity {
  /**
   * Construit l'entité des utilisateurs
   * @param server {KiAvenir} Le serveur de l'application
   * @constructor
   */
  constructor(server) {
    super(
      server,
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: {
          type: DataTypes.STRING(32)
        },
        email: {
          type: DataTypes.STRING(2)
        },
        password: {
          type: DataTypes.TEXT
        },
        salt: {
          type: DataTypes.STRING(4),
          defaultValue: ""
        }
      },
      {
        hooks: {
          beforeCreate: (user) => {
            // Génération du sel aléatoire
            user.salt = crypto.randomBytes(2).toString("hex"); // 4 caractères hexadécimaux

            // Chiffrement du mot de passe avec le sel
            user.password = encryptPassword(user.password, user.salt);
          }
        }
      }
    );
  }

  /**
   * Récupère la structure de l'entité
   * @returns {User} La structure de l'entité
   */
  get entityStructure() {
    return User;
  }

  /**
   * Récupère le nom de la table
   * @returns {string} Le nom de la table
   */
  get tableName() {
    return "users";
  }

  /**
   * Récupère les colonnes d'identifiant
   * @returns {string[]} Les colonnes d'identifiant
   */
  get identifierColumns() {
    return ["id"];
  }
}
