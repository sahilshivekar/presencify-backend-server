'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'students',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    field: 'student_id',
                },
                prn: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    field: 'student_prn',
                },
                firstName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'first_name',
                },
                lastName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'last_name',
                },
                middleName: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    field: 'middle_name',
                },
                dob: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'dob',
                },
                gender: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'gender',
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    field: 'email',
                },
                phoneNumber: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    field: 'phone_number',
                },
                enrollmentDate: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'enrollment_date',
                },
                academicStatus: {
                    type: Sequelize.ENUM('Active', 'Drop out', 'Graduated'),
                    allowNull: false,
                    field: 'academic_status',
                },
                password: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'password',
                },
                studentImgUrl: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    field: 'student_img_url',
                },
                schemeId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'schemes', // Ensure 'schemes' table exists
                        key: 'scheme_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'scheme_id',
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
                timestamps: true, // Enables automatic 'createdAt' and 'updatedAt'
                freezeTableName: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('students');
    },
};
