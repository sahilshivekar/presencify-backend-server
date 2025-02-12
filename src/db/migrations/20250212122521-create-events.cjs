'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'events',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'event_id',
                },
                title: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'event_title',
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'event_description',
                },
                imageUrl: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'event_image_url',
                },
                location: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'event_location',
                },
                startDatetime: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'event_start_datetime',
                },
                endDatetime: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'event_end_datetime',
                },
                registrationLink: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                    field: 'event_registration_link',
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
                uploadedBy: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'uploaded_by',
                    references: {
                        model: 'staff',
                        key: 'staff_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('events');
    },
};
