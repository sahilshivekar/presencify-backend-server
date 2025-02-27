'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`     
            -- below's insertion are for academic year 2024-2025
            -- div a for 8th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'A', semester_id from semesters
            where semester_number = 8 AND branch_id = 1;

            -- div b for 8th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'B', semester_id from semesters
            where semester_number = 8 AND branch_id = 1;

            -- div a for 6th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'A', semester_id from semesters
            where semester_number = 6 AND branch_id = 1;

            -- div b for 6th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'B', semester_id from semesters
            where semester_number = 6 AND branch_id = 1;

            -- div a for 4th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'A', semester_id from semesters
            where semester_number = 4 AND branch_id = 1;

            -- div b for 4th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'B', semester_id from semesters
            where semester_number = 4 AND branch_id = 1;

            -- div a for 2th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'A', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            -- div b for 2th semester comp
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'B', semester_id from semesters
            where semester_number = 2 AND branch_id = 1;

            -- div a for 2th semester civil
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'A', semester_id from semesters
            where semester_number = 2 AND branch_id = 2;

            -- div b for 2th semester civil
            INSERT INTO divisions (division_code, semester_id)
            SELECT 'B', semester_id from semesters
            where semester_number = 2 AND branch_id = 2;

        `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from divisions`)
    }
};
