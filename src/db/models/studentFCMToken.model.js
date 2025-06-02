import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js'; // Your sequelize instance
import Student from './student.model.js';

class StudentFCMToken extends Model { }

StudentFCMToken.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'student_fcm_token_id'
        },
        fcmToken: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'student_fcm_token',
            unique: {
                msg: 'This token is already in use'
            },
            validate: {
                notNull: {
                    msg: 'Token is not provided', // Validation message for notNull
                },
                notEmpty: {
                    msg: 'Token cannot be empty', // Validation message for notEmpty
                }
            },
        },
        studentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'student_id',
            references: {
                model: 'students',
                key: "student_id"
            },
            onDelete: 'CASCADE',
            validate: {
                notNull: {
                    msg: 'StudentId is not provided', // Validation message for notNull
                },
                notEmpty: {
                    msg: 'StudentId cannot be empty', // Validation message for notEmpty
                }
            },
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
        modelName: 'StudentFCMToken',
        tableName: 'student_fcm_tokens',
        sequelize,
        timestamps: false,
    }
)


Student.hasOne(StudentFCMToken, { sourceKey: 'id', foreignKey: 'studentId' })
StudentFCMToken.belongsTo(Student, { targetKey: 'id', foreignKey: 'studentId' })


export default StudentFCMToken;