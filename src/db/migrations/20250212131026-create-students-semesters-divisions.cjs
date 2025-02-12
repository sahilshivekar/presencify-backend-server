'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('students_semesters_divisions', {
            id: { 
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
                field: 'student_semester_divison_id'
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
                field: 'start_date'
            },
            endDate: {
                type: Sequelize.DATE, 
                allowNull: true, 
                field: 'end_date'
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
        }, {
            timestamps: true,
            freezeTableName: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('students_semesters_divisions');
    }
};