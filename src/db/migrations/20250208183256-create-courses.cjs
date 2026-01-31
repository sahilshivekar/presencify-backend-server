'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'courses',
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'course_id',
                },
                schemeId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'schemes', // Table name for schemes
                        key: 'scheme_id', // Primary key of schemes table
                    }, onDelete: 'CASCADE',
                    field: 'scheme_id',
                },
                courseCode: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true, // Ensures course codes are unique
                    field: 'course_code',
                },
                courseName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'course_name',
                },
                optionalCourse: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'course_optional_course',
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
        await queryInterface.dropTable('courses');
    },
};
