import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Timetable extends Model { }

Timetable.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'timetable_id'
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
        timetableVersion: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'timetable_version',
            defaultValue: 1,
            validate: {
                notNull: {
                    msg: 'Timetable version cannot be null'
                },
                isInt: {
                    msg: 'Timetable version must be an integer'
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
        modelName: 'Timetable',
        tableName: 'timetables'
    }
);

export default Timetable;