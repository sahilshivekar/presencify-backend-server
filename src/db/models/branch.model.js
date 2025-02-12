import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Branch extends Model { }

Branch.init(
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'branch_id'
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'branch_name',
            unique: {
                name: 'branch_name_unique',
                msg: 'Branch name already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Branch name cannot be empty'
                }
            }
        },
        abbreviation: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'branch_abbreviation',
            unique: {
                name: 'branch_abbreviation_unique',
                msg: 'Branch abbreviation already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Branch abbreviation cannot be empty'
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
        modelName: 'Branch',
        tableName: 'branches',
    }
);

export default Branch;