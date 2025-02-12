'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'schemes',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: "scheme_id",
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true, // To ensure no duplicate scheme names
                    field: 'scheme_name',
                },
                abbreviation: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'scheme_abbreviation',
                },
                universityId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'universities', // Table name for universities
                        key: 'university_id', // Primary key of universities table
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'university_id',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: "created_at",
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: "updated_at"
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
            }
        );
        await queryInterface.addIndex('schemes', ['university_id']);

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('schemes');
    },
};
