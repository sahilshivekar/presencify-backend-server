// src/test/util/setupTestDb.js
import { sequelize } from "../../config/db.connection.js";

const setupTestDb = () => {
    beforeAll(async () => {
        await sequelize.authenticate();
    });

    beforeEach(async () => {
        await Promise.all(
            Object.values(sequelize.models).map((model) =>
                model.destroy({ where: {}, force: true })
            )
        );
    });

    afterAll(async () => {
        await sequelize.close();
    });
};

export default setupTestDb;
