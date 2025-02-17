'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`        
            INSERT INTO branches (branch_id, branch_name, branch_abbreviation) VALUES
            (1,'Computer Engineering', 'Comp. Engg.'),
            (2,'Civil Engineering', 'Civil Engg.');
        `)

        await queryInterface.sequelize.query(`            
            ALTER SEQUENCE branches_branch_id_seq RESTART WITH 3;
        `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from branches`)
    }
};
