'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            -- sem 1 & 2 all branch have same nep 2020 scheme
            INSERT INTO Semesters (branch_id, semester_number, scheme_id, academic_start_year, academic_end_year) VALUES
            (1, 2, 2, 2024, 2025),
            (1, 4, 1, 2024, 2025),
            (2, 2, 2, 2024, 2025);
        `)

        // not adding semester 5,6,7,8 bcz they contains optional courses
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from Semesters`)
    }
};
