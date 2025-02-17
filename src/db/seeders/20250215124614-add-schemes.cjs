'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `INSERT INTO schemes (scheme_id, scheme_name, university_id) VALUES
            (1, 'REV-2019 ‘C’ Scheme', 1),
            (2, 'NEP-2020 Scheme', 1);`
        )

        await queryInterface.sequelize.query(`            
            ALTER SEQUENCE schemes_scheme_id_seq RESTART WITH 3;
        `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `DELETE FROM schemes WHERE scheme_name = 'REV-2019 ‘C’ Scheme' OR scheme_name = 'NEP-2020 Scheme';`
        )
    }
};
