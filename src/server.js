import dotenv from "dotenv"
dotenv.config({ path: './.env' })
import app from "./app.js"
import { config } from './config/config.js'
import { logger } from './config/logger.js';

// AI suggested change: Updated default port to 5000 for better conflict avoidance
const port = config.port || 5000;

app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server started on port ${port} [env: ${config.env}]`);
    logger.info(`📍 Server accessible at http://localhost:${port}`);
});