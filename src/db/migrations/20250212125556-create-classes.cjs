'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('classes', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
                field: 'class_id'
            },
            instructorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'instructor_id',
                references: {
                    model: 'staff',
                    key: 'staff_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            startTime: {
                type: Sequelize.TIME,
                allowNull: false,
                field: 'start_time'
            },
            endTime: {
                type: Sequelize.TIME,
                allowNull: false,
                field: 'end_time'
            },
            dayOfWeek: {
                type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                allowNull: false,
                field: 'day_of_week'
            },
            roomId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'room_id',
                references: {
                    model: 'rooms',
                    key: 'room_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            batchId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'batch_id',
                references: {
                    model: 'batches',
                    key: 'batch_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                field: 'is_active',
                defaultValue: true // Default to active
            },
            isActiveFrom: {
                type: Sequelize.DATE, // Or DATETIME if you need time as well
                allowNull: false,
                field: 'is_active_from'
            },
            activeTill: {
                type: Sequelize.DATE, // Or DATETIME if you need time as well
                allowNull: true,
                field: 'active_till'
            },
            classType: { // Added for the enum
                type: Sequelize.ENUM('lecture', 'tutorial', 'lab'),
                allowNull: false,
                field: 'class_type'
            },
            branchCourseSemesterId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'branch_course_semester_id',
                references: {
                    model: 'branch_course_semesters', // Correct table name
                    key: 'branch_course_semester_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('classes');
    }
};