import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Staff extends Model { }

Staff.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'staff_id'
        },
        firstName: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'first_name',
            validate: {
                notEmpty: {
                    msg: 'First name cannot be empty'
                }
            }
        },
        middleName: {
            type: Sequelize.STRING(255),
            allowNull: true,
            field: 'middle_name'
        },
        lastName: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'last_name',
            validate: {
                notEmpty: {
                    msg: 'Last name cannot be empty'
                }
            }
        },
        staffImageUrl: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'staff_image_url'
        },
        email: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'staff_email',
            unique: {
                name: 'staff_email_unique',
                msg: 'Email already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Email cannot be empty'
                },
                isEmail: {
                    msg: 'Invalid email format'
                }
            }
        },
        phoneNumber: {
            type: Sequelize.STRING(15),
            allowNull: false,
            field: 'staff_phone_number',
            validate: {
                notEmpty: {
                    msg: 'Phone number cannot be empty'
                }
            }
        },
        gender: {
            type: Sequelize.ENUM('Male', 'Female', 'Other'),
            allowNull: false,
            field: 'staff_gender',
            validate: {
                notNull: {
                    msg: 'Gender cannot be null'
                }
            }
        },
        highestQualification: {
            type: Sequelize.STRING(255),
            allowNull: true,
            field: 'staff_highest_qualification'
        },
        role: {
            type: Sequelize.ENUM('Teacher', 'Head of Department', 'Principal'),
            allowNull: true,
            field: 'staff_role'
        },
        password: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'staff_password',
            validate: {
                notEmpty: {
                    msg: 'Password cannot be empty'
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
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            field: 'is_active', // Corrected field name
            defaultValue: true
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Staff',
        tableName: 'staff',
    }
);

export default Staff;