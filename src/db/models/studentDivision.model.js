import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class StudentDivision extends Model { }

StudentDivision.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'student_divison_id'
        },
        studentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'student_id',
            references: {
                model: 'students',
                key: 'student_id'
            },
            validate: {
                notNull: {
                    msg: 'Student ID cannot be null'
                }
            }
        },
        divisionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'division_id',
            references: {
                model: 'divisions',
                key: 'division_id'
            },
            validate: {
                notNull: {
                    msg: 'Division ID cannot be null'
                }
            }
        },
        startDate: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'start_date',
            validate: {
                notNull: {
                    msg: 'Start date cannot be null'
                },
                isDate: {
                    msg: 'Invalid date format for Start date'
                }
            }
        },
        endDate: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'end_date',
            validate: {
                isDate: {
                    msg: 'Invalid date format for End date'
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
        }
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'StudentDivision', // Corrected model name
        tableName: 'students_divisions' // Corrected table name
    }
);

export default StudentDivision;