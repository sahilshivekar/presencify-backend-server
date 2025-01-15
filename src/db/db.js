import pkg from "pg";
const { Pool } = pkg
import dotenv from "dotenv"
dotenv.config({ path: './.env' })


const pool = new Pool({
    user: process.env.PG_DB_USER,
    host: process.env.PG_DB_HOST,
    database: process.env.PG_DB_NAME,
    password: process.env.PG_DB_PASSWORD,
    port: process.env.PG_DB_PORT,
});


export default pool