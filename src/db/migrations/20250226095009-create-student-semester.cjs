'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('students_semesters', {
            id: { 
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
                field: 'student_semester_id'
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
            semesterId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'semester_id',
                references: {
                    model: 'semesters', 
                    key: 'semester_id' 
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
        await queryInterface.dropTable('students_semesters');
    }
};