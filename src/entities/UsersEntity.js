import Entity from "../structures/Entity.js";
import User from "./structures/User.js";
import { DataTypes } from "sequelize";

export default class UsersEntity extends Entity {
  constructor(client) {
    super(client, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(32),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(2)
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      salt: {
        type: DataTypes.STRING(4),
        allowNull: false
      },
      createdAt: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
  }

  get entityStructure() {
    return User;
  }

  get tableName() {
    return "users";
  }

  get identifierColumns() {
    return ["id"];
  }
}
