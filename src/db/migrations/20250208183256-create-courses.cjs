'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'courses',
            {
                courseId: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'course_id',
                },
                schemeId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'schemes', // Table name for schemes
                        key: 'scheme_id', // Primary key of schemes table
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
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
                courseAbbreviation: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'course_abbreviation',
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
        await queryInterface.dropTable('courses');
    },
};
