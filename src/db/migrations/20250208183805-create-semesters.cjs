'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'semesters',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'semester_id',
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
                semesterNumber: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'semester_number',
                },
                academicStartYear: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'academic_start_year',
                },
                academicEndYear: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'academic_end_year',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'created_at',
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'updated_at',
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('semesters');
    },
};
