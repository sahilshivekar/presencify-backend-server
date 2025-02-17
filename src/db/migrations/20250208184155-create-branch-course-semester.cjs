'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'branch_course_semesters',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'branch_course_semester_id',
                },
                branchId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'branches', // Table name for branches
                        key: 'branch_id', // Primary key of branches table
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'branch_id',
                },
                courseId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'courses', // Table name for courses
                        key: 'course_id', // Primary key of courses table
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'course_id',
                },
                semesterNumber: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'semester_number',
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
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('branch_course_semesters');
    },
};
