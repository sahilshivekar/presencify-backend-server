import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Scheme extends Model { }

Scheme.init(
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'scheme_id'
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'scheme_name',
            unique: {
                name: 'scheme_name_unique',
                msg: 'Scheme name already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Scheme name cannot be empty'
                }
            }
        },
        abbreviation: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'scheme_abbreviation',
            unique: {
                name: 'scheme_abbreviation_unique', // Named constraint
                msg: 'Scheme abbreviation already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Scheme abbreviation cannot be empty'
                }
            }
        },
        universityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'university_id',
            references: {
                model: 'universities',
                key: 'university_id',
            },
            validate: {
                notNull: {
                    msg: 'University ID cannot be null'
                }
            }
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: "created_at",
            validate: {
                notNull: {
                    msg: 'Created At cannot be null'
                }
            }
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: "updated_at",
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
        modelName: 'Scheme',
        tableName: 'schemes',
    }
);

export default Scheme;