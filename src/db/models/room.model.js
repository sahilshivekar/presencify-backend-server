import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Room extends Model { }

Room.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'room_id'
        },
        roomNumber: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'room_number',
            unique: {
                name: 'room_number_unique',
                msg: 'Room number already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Room number cannot be empty'
                }
            }
        },
        sittingCapacity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'sitting_capacity',
            defaultValue: 60,
            validate: {
                notNull: {
                    msg: 'Sitting capacity cannot be null'
                },
                isInt: {
                    msg: 'Sitting capacity must be an integer'
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
        modelName: 'Room',
        tableName: 'rooms'
    }
);

export default Room;