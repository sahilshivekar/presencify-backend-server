import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Event extends Model { }

Event.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'event_id'
        },
        title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'event_title',
            validate: {
                notEmpty: {
                    msg: 'Title cannot be empty'
                }
            }
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'event_description'
        },
        imageUrl: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'event_image_url'
        },
        imagePublicId: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'event_image_public_id'
        },
        location: {
            type: Sequelize.STRING(255),
            allowNull: true,
            field: 'event_location'
        },
        startDatetime: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'event_start_datetime',
            validate: {
                notNull: {
                    msg: 'Start datetime cannot be null'
                },
                isDate: {
                    msg: 'Invalid date/time format for Start datetime'
                }
            }
        },
        endDatetime: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'event_end_datetime',
            validate: {
                notNull: {
                    msg: 'End datetime cannot be null'
                },
                isDate: {
                    msg: 'Invalid date/time format for End datetime'
                }
            }
        },
        registrationLink: {
            type: Sequelize.STRING(500),
            allowNull: true,
            field: 'event_registration_link',
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
        uploadedBy: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'uploaded_by',
            references: {
                model: 'teacher',
                key: 'teacher_id',
            },
            validate: {
                notNull: {
                    msg: 'Uploaded By cannot be null'
                }
            }
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Event',
        tableName: 'events',
    }
);

export default Event;