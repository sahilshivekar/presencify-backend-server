'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            

            -- batches for sem 8 of 2024-2025 
            INSERT INTO batches (batch_code, semester_id)
            SELECT 'BA1', semester_id from semesters
            where semester_number = 8 AND branch_id = 2;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'BA2', semester_id from semesters
            where semester_number = 8 AND branch_id = 2;

            
            -- batches for te sem 6 of 2024-2025
            INSERT INTO batches (batch_code, semester_id)
            SELECT 'TA1', semester_id from semesters
            where semester_number = 6 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'TA2', semester_id from semesters
            where semester_number = 6 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'TB1', semester_id from semesters
            where semester_number = 6 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'TB2', semester_id from semesters
            where semester_number = 6 AND branch_id = 1;



            -- batches for sem 4 of 2024-2025
            INSERT INTO batches (batch_code, semester_id)
            SELECT 'SA1', semester_id from semesters
            where semester_number = 4 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'SA2', semester_id from semesters
            where semester_number = 4 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'SB1', semester_id from semesters
            where semester_number = 4 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'SB2', semester_id from semesters
            where semester_number = 4 AND branch_id = 1;



            -- batches for sem 2 of 2024-2025
            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FA1', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FA2', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FB1', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FB2', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FC1', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FC2', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            
            -- batches for sem 2 of 2024-2025 (civil)
            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FA1', semester_id from semesters
            where semester_number = 2 AND branch_id = 2;

            INSERT INTO batches (batch_code, semester_id)
            SELECT 'FA2', semester_id from semesters
            where semester_number = 2 AND branch_id = 2;

        `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from batches`)
    }
};
