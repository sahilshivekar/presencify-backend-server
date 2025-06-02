'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendances', {
            id: { // Added a primary key
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
                field: 'attendance_id'
            },
            classId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'class_id',
                references: {
                    model: 'classes',
                    key: 'class_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            BLEsessionUUID: {
                type: Sequelize.STRING,
                allowNull: false,
                field: 'ble_session_uuid'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                field: 'attendance_date'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: 'created_at'
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: 'updated_at'
            }
        }, {
            timestamps: true,
            freezeTableName: true
        });

        // Create the join table for students and attendance
        await queryInterface.createTable('attendance_students', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
                field: 'attendance_student_id'
            },
            attendanceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'attendance_id',
                references: {
                    model: 'attendances',
                    key: 'attendance_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            studentId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'student_id',
                references: {
                    model: 'students',
                    key: 'student_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            attendanceStatus: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                field: 'attendance_status'
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
        }, {
            timestamps: true,
            freezeTableName: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('attendance_students'); // Drop the join table first
        await queryInterface.dropTable('attendances');
    }
};