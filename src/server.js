import dotenv from "dotenv"
dotenv.config({ path: './.env' })
import app from "./app.js"
import { config } from './config/config.js'

const port = config.port || 8000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at port: ${port}`);
});