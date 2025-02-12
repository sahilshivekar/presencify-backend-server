'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'teacher_teaches_course',
            {
                id: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    primaryKey: true,
                    field: 'teacher_subject_id',
                },
                teacherId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'teacher_id',
                    references: {
                        model: 'staff',
                        key: 'staff_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                courseId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'course_id',
                    references: {
                        model: 'courses', // Adjust based on actual course table name
                        key: 'course_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
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
        await queryInterface.dropTable('teacher_teaches_course');
    },
};
