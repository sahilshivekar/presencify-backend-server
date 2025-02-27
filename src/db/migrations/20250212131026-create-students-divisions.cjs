'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('students_divisions', {
            id: { 
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
                field: 'student_divison_id'
            },
            studentId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'student_id',
                references: {
                    model: 'students',
                    key: 'student_id' 
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            divisionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'division_id',
                references: {
                    model: 'divisions', 
                    key: 'division_id' 
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            startDate: {
                type: Sequelize.DATE, 
                allowNull: false,
                field: 'start_date',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            endDate: {
                type: Sequelize.DATE, 
                allowNull: true, 
                field: 'end_date'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: 'created_at',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: 'updated_at',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, {
            timestamps: true,
            freezeTableName: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('students_divisions');
    }
};