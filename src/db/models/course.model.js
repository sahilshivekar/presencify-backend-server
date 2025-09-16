import { Sequelize, Model, UUIDV4 } from 'sequelize';
import sequelize from '../../config/db.connection.js';
import BranchCourseSemester from './branchCourseSemester.model.js';
import Scheme from './scheme.model.js';
import TeacherTeachesCourse from './teacherTeachesCourse.model.js';
import Teacher from './teacher.model.js';
import Class from './class.model.js';
class Course extends Model { }

Course.init(
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
            allowNull: false,
            field: 'course_id'
        },
        schemeId: {
            type: Sequelize.UUID,
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
            field: 'created_at'
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at'
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
BranchCourseSemester.belongsTo(Course, { foreignKey: 'courseId', targetKey: 'id' });


Course.belongsTo(Scheme, { foreignKey: 'schemeId', targetKey: 'id' });
Scheme.hasMany(Course, { sourceKey: 'id', foreignKey: 'schemeId' });


Course.hasMany(Class, { sourceKey: 'id', foreignKey: 'courseId' });
Class.belongsTo(Course, { foreignKey: 'courseId', targetKey: 'id' });


export default Course;