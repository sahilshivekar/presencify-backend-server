import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Course extends Model { }

Course.init(
    {
        courseId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'course_id'
        },
        schemeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'scheme_id',
            references: {
                model: 'schemes',
                key: 'scheme_id',
            },
            validate: {
                notNull: {
                    msg: 'Scheme ID cannot be null'
                }
            }
        },
        courseCode: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'course_code',
            unique: {
                name: 'course_code_unique',
                msg: 'Course code already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Course code cannot be empty'
                }
            }
        },
        courseName: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'course_name',
            validate: {
                notEmpty: {
                    msg: 'Course name cannot be empty'
                }
            }
        },
        courseAbbreviation: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'course_abbreviation',
            validate: {
                notEmpty: {
                    msg: 'Course abbreviation cannot be empty'
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
        modelName: 'Course',
        tableName: 'courses',
    }
);

export default Course;