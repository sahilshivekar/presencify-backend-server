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
        fileUrl: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'notice_file_url'
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'notice_description'
        },
        expiryDate: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'expiry_date',
            validate: {
                isDate: {
                    msg: 'Invalid date format for Expiry date'
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
        category: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'notice_category',
            validate: {
                notEmpty: {
                    msg: 'Category cannot be empty'
                }
            }
        },
        audiences: {
            type: Sequelize.ENUM('BE', 'FE', 'SE', 'TE', 'All Students', 'Staff', 'Everyone'),
            allowNull: false,
            field: 'notice_audiences',
            validate: {
                notNull: {
                    msg: 'Audiences cannot be null'
                }
            }
        },
        branchId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'branch_id',
            references: {
                model: 'branches',
                key: 'branch_id',
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