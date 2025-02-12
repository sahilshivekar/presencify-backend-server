'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'rooms',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'room_id'
                },
                roomNumber: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'room_number',
                    unique: true
                },
                sittingCapacity: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'sitting_capacity',
                    defaultValue: 60
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'created_at'
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'updated_at'
                }
            },
            {
                timestamps: true,
                freezeTableName: true
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('rooms');
    }
};