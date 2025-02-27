'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            
            -- batches for sem 8 of 2024-2025 (computer)
            INSERT INTO batches (batch_code, division_id)
            SELECT 'BA1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 8 AND semesters.branch_id = 1 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'BA2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 8 AND semesters.branch_id = 1 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'BB1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 8 AND semesters.branch_id = 1 AND divisions.division_code = 'B'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'BB2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 8 AND semesters.branch_id = 1 AND divisions.division_code = 'B'
            limit 1;


            -- batches for te sem 6 of 2024-2025 (computer)
            INSERT INTO batches (batch_code, division_id)
            SELECT 'TA1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 6 AND semesters.branch_id = 1 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'TA2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 6 AND semesters.branch_id = 1 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'TB1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 6 AND semesters.branch_id = 1 AND divisions.division_code = 'B'   
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'TB2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 6 AND semesters.branch_id = 1 AND divisions.division_code = 'B'   
            limit 1;

            
            -- batches for sem 4 of 2024-2025 (computer)
            INSERT INTO batches (batch_code, division_id)
            SELECT 'SA1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 4 AND semesters.branch_id = 1 AND divisions.division_code = 'A'   
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'SA2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 4 AND semesters.branch_id = 1 AND divisions.division_code = 'A'   
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'SB1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 4 AND semesters.branch_id = 1 AND divisions.division_code = 'B'   
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'SB2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 4 AND semesters.branch_id = 1 AND divisions.division_code = 'B'   
            limit 1;


            -- batches for sem 2 of 2024-2025 (computer)
            INSERT INTO batches (batch_code, division_id)
            SELECT 'FA1', divisions.division_id from divisions  
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 1 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'FA2', divisions.division_id from divisions  
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 1 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'FB1', divisions.division_id from divisions  
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 1 AND divisions.division_code = 'B'
            limit 1;
            
            INSERT INTO batches (batch_code, division_id)
            SELECT 'FB2', divisions.division_id from divisions  
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 1 AND divisions.division_code = 'B'
            limit 1;


            -- batches for sem 2 of 2024-2025 (civil)
            INSERT INTO batches (batch_code, division_id)
            SELECT 'FA1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 2 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'FA2', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 2 AND divisions.division_code = 'A'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'FB1', divisions.division_id from divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 2 AND divisions.division_code = 'B'
            limit 1;

            INSERT INTO batches (batch_code, division_id)
            SELECT 'FB2', divisions.division_id from divisions  
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 2 AND divisions.division_code = 'B'
            limit 1;
        `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from batches`)
    }
};
