import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Notice extends Model { }

Notice.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'notice_id'
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'notice_title',
            validate: {
                notEmpty: {
                    msg: 'Title cannot be empty'
                }
            }
        },
        imageFileUrl: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'notice_file_url'
        },
        imageFilePublicId: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'notice_file_public_id'
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'notice_description'
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
        audiences: {
            type: Sequelize.ENUM('Students', 'Staff', 'Everyone'),
            allowNull: false,
            field: 'notice_audiences',
            validate: {
                notNull: {
                    msg: 'Audiences cannot be null'
                },
                isIn: {
                    args: [['Students', 'Staff', 'Everyone']],
                    msg: 'Audiences must be one of the following: Students, Staff, Everyone'
                }
            }
        },
        uploadedBy: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'uploaded_by',
            references: {
                model: 'staff',
                key: 'staff_id',
            },
            validate: {
                notNull: {
                    msg: 'Uploaded By cannot be null'
                }
            }
        },
        isPinned: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_pinned'
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Notice',
        tableName: 'notices',
    }
);

export default Notice;