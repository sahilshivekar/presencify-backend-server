import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';
import bcrypt from 'bcrypt';

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
        staffImagePublicId: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'staff_image_public_id'
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
            unique: {
                msg: 'Phone number already exists'
            },
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
                notEmpty: {
                    msg: 'Gender cannot be empty'
                },
                isIn: { // <-- Use isIn validator
                    args: [['Male', 'Female', 'Other']], // Array of allowed values
                    msg: 'Invalid gender value. Must be Male, Female, or Other'
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
            allowNull: false,
            field: 'staff_role',
            validate: {
                isIn: {
                    args: [['Teacher', 'Head of Department', 'Principal']], // Array of allowed values
                    msg: 'Invalid role value. Must be Teacher, Head of Department, or Principal'
                },
                notNull: {
                    msg: 'Role cannot be null'
                },
                notEmpty: {
                    msg: 'Role cannot be empty'
                }
            }
        },
        password: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'staff_password',
            validate: {
                notEmpty: {
                    msg: 'Password cannot be empty'
                },
                notNull: {
                    msg: 'Password cannot be null'
                },
                isStrongPassword(value) {
                    // Custom validation logic for password
                    if (!/[A-Z]/.test(value)) {
                        throw new Error('Password must contain at least one uppercase letter');
                    }
                    if (!/\d/.test(value)) {
                        throw new Error('Password must contain at least one number');
                    }
                    if (!/[^\w]/.test(value)) {
                        throw new Error('Password must contain at least one special character');
                    }
                    if (/\s/.test(value)) {
                        throw new Error('Password cannot contain spaces');
                    }
                    if (value.length < 8) {
                        throw new Error('Password must be at least 8 characters long');
                    }
                },
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
        refreshToken: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'refresh_token'
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Staff',
        tableName: 'staff',
    }
);


Staff.prototype.isPasswordMatching = async function (password) {
    return await bcrypt.compare(password, this.password)
}

Staff.beforeCreate(async (staff) => {
    if (staff?.password) {
        staff.password = await bcrypt.hash(staff.password, Number(process.env.BCRYPT_SALT))
    }
})

Staff.beforeUpdate(async (staff) => {
    if (staff.changed('password') && staff?.password) {
        staff.password = await bcrypt.hash(staff.password, Number(process.env.BCRYPT_SALT))
    }
    if(staff.changed('email')){
        staff.email = staff.email.toLowerCase();
        staff.isVerified = false;   
    }
})

Staff.prototype.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this.id,
            email: this.email,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
        }
    )
}

Staff.prototype.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this.id,
            email: this.email,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY
        }
    )
}


export default Staff;