import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Division from './division.model.js';
import Batch from './batch.model.js';

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
            },
            unique: {
                name: 'semester_unique',
                msg: 'Semester already exists'
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
            },
            unique: {
                name: 'semester_unique',
                msg: 'Semester already exists'
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
            },
            unique: {
                name: 'semester_unique',
                msg: 'Semester already exists'
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
            },
            unique: {
                name: 'semester_unique',
                msg: 'Semester already exists'
            }
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
                },
                isInt: {
                    msg: 'Scheme ID must be an integer'
                }
            },
            unique: {
                name: 'semester_unique',
                msg: 'Semester already exists'
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

Semester.hasMany(Division, {sourceKey: "id", foreignKey: "semesterId"})
Division.belongsTo(Semester, {foreignKey: "semesterId", targetKey: "id"})   


export default Semester;
