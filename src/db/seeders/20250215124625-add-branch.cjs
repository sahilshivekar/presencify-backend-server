'use strict';

const { v4: uuidv4 } = require('uuid'); // Import the uuid function

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('branches', [
            {
                branch_id: uuidv4(), // Generate a UUID
                branch_name: 'Computer Engineering',
                branch_abbreviation: 'Comp. Engg.',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                branch_id: uuidv4(), // Generate another UUID
                branch_name: 'Civil Engineering',
                branch_abbreviation: 'Civil Engg.',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('branches', {
            branch_name: {
                [Sequelize.Op.in]: ['Computer Engineering', 'Civil Engineering']
            }
        });
    }
};