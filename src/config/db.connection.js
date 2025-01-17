import { Sequelize } from "sequelize"
import config from "./db.config.js"

const env = process.env.PG_CONFIG;

const sequelize = new Sequelize(config[env])

export default sequelize
