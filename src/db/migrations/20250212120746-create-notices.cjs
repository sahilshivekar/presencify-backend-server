'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'notices',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    field: 'notice_id', // Maps 'id' in model to 'notice_id' in DB
                },
                title: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'notice_title',
                },
                imageFileUrl: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'notice_file_url'
                },
                imageFilePublicId: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'notice_file_public_id'
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'notice_description',
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
                audiences: {
                    type: Sequelize.ENUM('Students', 'Staff', 'Everyone'),
                    allowNull: false,
                    field: 'notice_audiences',
                },
                uploadedBy: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'staff',
                        key: 'staff_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'uploaded_by',
                },
                isPinned: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: 'is_pinned',
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notices');
    },
};
