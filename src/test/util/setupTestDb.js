// src/test/util/setupTestDb.js
import sequelize from "../../config/db.connection.js";
import { logger } from "../../config/logger.js";

const setupTestDb = () => {
    beforeAll(async () => {
        try {
            // Test database connection
            await sequelize.authenticate();            
        } catch (error) {
            logger.error('✗ Database setup failed:', error);
            throw error;
        }
    });

    beforeEach(async () => {
        try {
            // Clean all tables - much faster approach
            const modelNames = Object.keys(sequelize.models);
            
            if (modelNames.length === 0) {
                throw new Error('No models found! Make sure all models are imported.');
            }
            
            // Use raw SQL for faster cleanup (PostgreSQL specific)
            await sequelize.query('TRUNCATE TABLE ' + 
                modelNames.map(name => `"${sequelize.models[name].tableName}"`).join(', ') + 
                ' RESTART IDENTITY CASCADE');

        } catch (error) {
            logger.error('✗ Database cleanup failed:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            await sequelize.close();
        } catch (error) {
            logger.error('✗ Error closing database connection:', error);
        }
    });
};

export default setupTestDb;
