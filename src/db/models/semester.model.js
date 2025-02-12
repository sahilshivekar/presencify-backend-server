import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Semester extends Model { }

Semester.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'semester_id'
        },
        branchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'branch_id',
            references: {
                model: 'branches',
                key: 'branch_id',
            },
            validate: {
                notNull: {
                    msg: 'Branch ID cannot be null'
                }
            }
        },
        semesterNumber: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'semester_number',
            validate: {
                notNull: {
                    msg: 'Semester number cannot be null'
                },
                isInt: {
                    msg: 'Semester number must be an integer'
                }
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
            allowNull: false,
            field: 'academic_end_year',
            validate: {
                notNull: {
                    msg: 'Academic end year cannot be null'
                },
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
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Semester',
        tableName: 'semesters',
    }
);

export default Semester;
