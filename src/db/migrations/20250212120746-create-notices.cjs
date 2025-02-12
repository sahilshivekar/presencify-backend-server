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
                fileUrl: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    field: 'notice_file_url',
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'notice_description',
                },
                expiryDate: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    field: 'expiry_date',
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
                category: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'notice_category',
                },
                audiences: {
                    type: Sequelize.ENUM('BE', 'FE', 'SE', 'TE', 'All Students', 'Staff', 'Everyone'),
                    allowNull: false,
                    field: 'notice_audiences',
                },
                branchId: {
                    type: Sequelize.INTEGER,
                    allowNull: true, // will show for to all branches students if null
                    references: {
                        model: 'branches',
                        key: 'branch_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'branch_id',
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
