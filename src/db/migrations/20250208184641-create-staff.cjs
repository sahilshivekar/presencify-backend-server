'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'staff',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                    field: 'staff_id',
                },
                firstName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'first_name',
                },
                middleName: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'middle_name',
                },
                lastName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'last_name',
                },
                staffImageUrl: {
                    type: Sequelize.TEXT, 
                    allowNull: true,
                    field: 'staff_image_url',
                },
                email: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field:'staff_email',
                },
                phoneNumber: {
                    type: Sequelize.STRING(15),
                    allowNull: false,
                    field: 'staff_phone_number',
                },
                gender: {
                    type: Sequelize.ENUM('Male', 'Female', 'Other'), // i want enum('Male', 'Female', 'Other')
                    allowNull: false,
                    field: 'staff_gender',
                },
                highestQualification: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'staff_highest_qualification',
                },
                role: {
                    type: Sequelize.ENUM('Teacher', 'Head of Department', 'Principal'),
                    allowNull: true, // i want enum('teacher', 'hod', 'principal')
                    field: 'staff_role',
                },
                password: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'staff_password',
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
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    field: 'updated_at',
                    defaultValue: true,
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('staff');
    },
};
