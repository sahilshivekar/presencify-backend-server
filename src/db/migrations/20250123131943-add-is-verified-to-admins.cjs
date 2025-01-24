'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('admins', 'is_verified', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_verified'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('admins', 'is_verified')
    }  
};
