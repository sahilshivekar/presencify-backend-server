import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Division extends Model { }

Division.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'division_id'
        },
        divisionCode: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'division_code',
            validate: {
                notEmpty: {
                    msg: 'Division code cannot be empty'
                }
            },
            unique: {
                msg: 'This division code is already in use'
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
            },
            unique: {
                msg: 'This division code is already in use'
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
        modelName: 'Division',
        tableName: 'divisions'
    }
);

export default Division;