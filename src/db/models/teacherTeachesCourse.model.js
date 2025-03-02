import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Staff from './staff.model.js';
import Course from './course.model.js';


class TeacherTeachesCourse extends Model { }

TeacherTeachesCourse.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            field: 'teacher_subject_id',
            autoIncrement: true,
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
            },
            unique: {
                name: 'one_subject_for_one_teacher_only_once',
                msg: 'Teacher already have this subject in the teaching list'
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
            },
            unique: {
                name: 'one_subject_for_one_teacher_only_once',
                msg: 'Teacher already have this subject in the teaching list'
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
        tableName: 'teacher_teaches_course', // Corrected Table Name,
    }
);

export default TeacherTeachesCourse;