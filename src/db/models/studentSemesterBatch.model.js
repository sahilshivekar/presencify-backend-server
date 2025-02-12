import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class StudentSemesterBatch extends Model { }

StudentSemesterBatch.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'students_semesters_batches_id'
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
        semesterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'semester_id',
            references: {
                model: 'semesters',
                key: 'semester_id'
            },
            validate: {
                notNull: {
                    msg: 'Semester ID cannot be null'
                }
            }
        },
        batchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'batch_id',
            references: {
                model: 'batches',
                key: 'batch_id'
            },
            validate: {
                notNull: {
                    msg: 'Batch ID cannot be null'
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
        modelName: 'StudentSemesterBatch',
        tableName: 'students_semesters_batches'
    }
);

export default StudentSemesterBatch;