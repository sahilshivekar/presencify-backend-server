'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `INSERT INTO universities (university_id, university_name, university_abbreviation) VALUES
            (1, 'University of Mumbai', 'UOM');`
        )

        await queryInterface.sequelize.query(`            
            ALTER SEQUENCE universities_university_id_seq RESTART WITH 2;
        `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `DELETE FROM universities WHERE university_name = 'University of Mumbai';`
        )
    }
};
