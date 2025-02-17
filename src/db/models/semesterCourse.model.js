import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class SemesterCourse extends Model { }

SemesterCourse.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'semester_courses_id'
        },
        semesterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'semester_id',
            references: {
                model: 'semesters',
                key: 'semester_id',
            },
            validate: {
                notNull: {
                    msg: 'Semester ID cannot be null'
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
        modelName: 'SemesterCourse', // Corrected Model Name
        tableName: 'semester_courses', // Corrected Table Name
    }
);

export default SemesterCourse;