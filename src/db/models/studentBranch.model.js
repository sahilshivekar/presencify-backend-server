import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class StudentBranch extends Model { }

StudentBranch.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'student_branch_id'
        },
        branchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'branch_id',
            references: {
                model: 'branches',
                key: 'branch_id'
            },
            validate: {
                notNull: {
                    msg: 'Branch ID cannot be null'
                }
            },
            unique: {
                msg: 'Student is already present in this branch',
                name: 'student_to_one_branch_only_once'
            }
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
            },
            unique: {
                msg: 'Student is already present in this branch',
                name: 'student_to_one_branch_only_once'
            }
        },
        academicStartYear: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'academic_start_year',
            validate: {
                notNull: {
                    msg: 'Academic start year cannot be null'
                },
                isInt: {
                    msg: 'Academic start year must be an integer'
                }
            }
        },
        academicEndYear: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'academic_end_year',
            validate: {
                isInt: {
                    msg: 'Academic end year must be an integer'
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
        modelName: 'StudentBranch',
        tableName: 'student_branch'
    }
);

export default StudentBranch;