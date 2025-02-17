'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'verification_codes',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    field: 'verification_code_id'
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    references: {
                        model: 'admins',
                        key: 'admin_email'
                    },
                    validate: {
                        notEmpty: {
                            msg: 'Email cannot be empty',
                        },
                        isEmail: {
                            msg: 'Must be a valid email address',
                        }
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'admin_email',
                },
                code: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    validate: {
                        notEmpty: {
                            msg: 'Code cannot be empty'
                        }
                    }
                },
                expiresAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'expires_at'
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
                freezeTableName: true,
            }
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('verification_codes')
    }
};
