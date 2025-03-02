import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';
import BranchCourseSemester from './branchCourseSemester.model.js';
import Scheme from './scheme.model.js';
import TeacherTeachesCourse from './teacherTeachesCourse.model.js';
import Staff from './staff.model.js';
class Course extends Model { }

Course.init(
    {
        id: {
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
        code: {
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
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'course_name',
            validate: {
                notEmpty: {
                    msg: 'Course name cannot be empty'
                }
            }
        },
        optionalSubject: {
            type: Sequelize.STRING(255),
            allowNull: true,
            field: 'course_optional_subject',
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

Course.hasMany(BranchCourseSemester, {
    sourceKey: 'id',
    foreignKey: 'courseId',
})
BranchCourseSemester.belongsTo(Course, {foreignKey: 'courseId', targetKey: 'id'});


Course.belongsTo(Scheme, {foreignKey: 'schemeId', targetKey: 'id'});
Scheme.hasMany(Course, {sourceKey: 'id', foreignKey: 'schemeId'});


Course.hasMany(TeacherTeachesCourse, { sourceKey: 'id', foreignKey: 'courseId' });
TeacherTeachesCourse.belongsTo(Course, { foreignKey: 'courseId', targetKey: 'id' });

TeacherTeachesCourse.belongsTo(Staff, { foreignKey: 'teacherId', targetKey: 'id' });
Staff.hasMany(TeacherTeachesCourse, { sourceKey: 'id', foreignKey: 'teacherId' });

export default Course;