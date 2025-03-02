'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'student_branch',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'student_branch_id'
                },
                branchId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'branch_id',
                    references: {
                        model: 'branches',
                        key: 'branch_id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
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
                academicStartYear: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'academic_start_year'
                },
                academicEndYear: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    field: 'academic_end_year'
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
            },
            {
                timestamps: true,
                freezeTableName: true,
                uniqueKeys: { 
                    student_to_one_branch_only_once: { 
                        fields: ['branch_id', 'student_id'] 
                    }
                }
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_branch');
    }
};