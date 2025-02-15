'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'divisions',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'division_id'
                },
                divisionCode: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'division_code',
                    unique: "only_one_div_with_same_name"
                },
                semesterId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'semester_id',
                    references: {
                        model: 'semesters',
                        key: 'semester_id' 
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    unique: "only_one_div_with_same_name"
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
        await queryInterface.dropTable('divisions');
    }
};