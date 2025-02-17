import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';


class BranchCourseSemester extends Model { }

BranchCourseSemester.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'branch_course_semester_id'
        },
        branchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'branch_id',
            references: {
                model: 'branches',
                key: 'branch_id',
            },
            validate: {
                notNull: {
                    msg: 'Branch ID cannot be null'
                }
            }
        },
        courseId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'course_id',
            references: {
                model: 'courses',
                key: 'course_id',
            },
            validate: {
                notNull: {
                    msg: 'Course ID cannot be null'
                }
            }
        },
        semesterNumber: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'semester_number',
            validate: {
                notNull: {
                    msg: 'Semester number cannot be null'
                },
                isInt: {
                    msg: 'Semester number must be an integer'
                }
            }
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'created_at',
            validate: {
                notNull: {
                    msg: 'Created At cannot be null'
                }
            }
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'updated_at',
            validate: {
                notNull: {
                    msg: 'Updated At cannot be null'
                }
            }
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'BranchCourseSemester', // Corrected Model Name
        tableName: 'branch_course_semesters', // Corrected Table Name
    }
);

export default BranchCourseSemester;