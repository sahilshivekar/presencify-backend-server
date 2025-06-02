'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('student_fcm_tokens',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    field: 'student_fcm_token_id'
                },
                fcmToken: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                    field: 'student_fcm_token',
                    unique: {
                        msg: 'This token is already in use'
                    },
                    validate: {
                        notNull: {
                            msg: 'Token is not provided', // Validation message for notNull
                        },
                        notEmpty: {
                            msg: 'Token cannot be empty', // Validation message for notEmpty
                        }
                    },
                },
                studentId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'student_id',
                    references: {
                        model: 'students',
                        key: "student_id"
                    },
                    onDelete: 'CASCADE'
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
            }
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_fcm_tokens')
    }
};
