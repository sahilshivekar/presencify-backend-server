import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Batch extends Model { }

Batch.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'batch_id'
        },
        batchCode: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'batch_code',
            validate: {
                notEmpty: {
                    msg: 'Batch code cannot be empty'
                }
            },
            unique: {
                name: 'batch_unique',
                msg: 'Batch already exists'
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
                name: 'batch_unique',
                msg: 'Batch already exists'
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
        modelName: 'Batch',
        tableName: 'batches'
    }
);

export default Batch;