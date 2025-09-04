'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'admins',
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'admin_id'
                },
                email: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    validate: {
                        notEmpty: {
                            msg: 'Email cannot be empty', // Validation message for notEmpty
                        },
                        isEmail: {
                            msg: 'Must be a valid email address', // Validation message for isEmail
                        }
                    },
                    field: 'admin_email'
                },
                username: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    validate: {
                        notEmpty: {
                            msg: 'Username cannot be empty', // Validation message for notEmpty
                        },
                        notContains: {
                            args: ' ',
                            msg: 'Username cannot contain spaces', // Validation message for notContains
                        },
                        isLowercase(value) {
                            if (value !== value.toLowerCase()) {
                                throw new Error('Username must be in lowercase');
                            }
                        }
                    },
                    field: 'admin_username'
                },
                password: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    validate: {
                        isStrongPassword(value) {
                            // Custom validation logic for password
                            if (!/[A-Z]/.test(value)) {
                                throw new Error('Password must contain at least one uppercase letter');
                            }
                            if (!/\d/.test(value)) {
                                throw new Error('Password must contain at least one number');
                            }
                            if (!/[^\w]/.test(value)) {
                                throw new Error('Password must contain at least one special character');
                            }
                            if (/\s/.test(value)) {
                                throw new Error('Password cannot contain spaces');
                            }
                            if (value.length < 8) {
                                throw new Error('Password must be at least 8 characters long');
                            }
                        },
                    },
                    field: 'admin_password'
                },
                refreshToken: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'refresh_token'
                },
                isVerified: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: 'is_verified'
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
                timestamps: true, // Enables automatic 'createdAt' and 'updatedAt'
                freezeTableName: true,
            }
        );

        // Adding unique constraint after table creation
        await queryInterface.addConstraint('admins', {
            fields: ['admin_email'],
            type: 'unique'
        });

        await queryInterface.addConstraint('admins', {
            fields: ['admin_username'],
            type: 'unique'
        });

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('admins');
    },
};
