'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            CREATE TYPE public.enum_students_admission_type AS ENUM ('DSE', 'FE');
          `);
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
                academicStatus: {
                    type: Sequelize.ENUM('Active', 'Drop out', 'Graduated'),
                    allowNull: false,
                    field: 'academic_status',
                },
                admissionYear: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'admission_year',
                },
                admissionType: {
                    type: Sequelize.ENUM('DSE', 'FE'),
                    allowNull: false,
                    field: 'admission_type',
                },
                password: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'password',
                    defaultValue: 'Student@123'
                },
                refreshToken: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'refresh_token'
                },
                studentImgUrl: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'student_img_url',
                },
                studentImgPublicId: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'student_img_public_id',
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
                branchId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'branches', // Ensure 'branches' table exists
                        key: 'branch_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    field: 'branch_id',
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
