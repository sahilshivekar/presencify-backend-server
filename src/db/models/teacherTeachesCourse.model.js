import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class TeacherTeachesCourse extends Model { }

TeacherTeachesCourse.init(
    {
        id: {
            type: Sequelize.STRING, // Corrected data type to STRING
            allowNull: false,
            primaryKey: true,
            field: 'teacher_subject_id',
            validate: {
                notEmpty: {
                    msg: 'ID cannot be empty'
                }
            }
        },
        teacherId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'teacher_id',
            references: {
                model: 'staff',
                key: 'staff_id',
            },
            validate: {
                notNull: {
                    msg: 'Teacher ID cannot be null'
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
        modelName: 'TeacherTeachesCourse', // Corrected Model Name
        tableName: 'teacher_teaches_course', // Corrected Table Name
    }
);

export default TeacherTeachesCourse;