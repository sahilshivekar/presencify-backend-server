import { Sequelize, Model } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Class extends Model { }

Class.init(
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'class_id'
        },
        instructorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'instructor_id',
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            validate: {
                notNull: {
                    msg: 'Instructor ID cannot be null'
                }
            }
        },
        startTime: {
            type: Sequelize.TIME,
            allowNull: false,
            field: 'start_time',
            validate: {
                notNull: {
                    msg: 'Start time cannot be null'
                }
            }
        },
        endTime: {
            type: Sequelize.TIME,
            allowNull: false,
            field: 'end_time',
            validate: {
                notNull: {
                    msg: 'End time cannot be null'
                }
            }
        },
        dayOfWeek: {
            type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
            allowNull: false,
            field: 'day_of_week',
            validate: {
                notNull: {
                    msg: 'Day of week cannot be null'
                }
            }
        },
        roomId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'room_id',
            references: {
                model: 'rooms',
                key: 'room_id'
            },
            validate: {
                notNull: {
                    msg: 'Room ID cannot be null'
                }
            }
        },
        batchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'batch_id',
            references: {
                model: 'batches',
                key: 'batch_id'
            },
            validate: {
                notNull: {
                    msg: 'Batch ID cannot be null'
                }
            }
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            field: 'is_active',
            defaultValue: true,
            validate: {
                notNull: {
                    msg: 'Is active cannot be null'
                }
            }
        },
        isActiveFrom: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'is_active_from',
            validate: {
                notNull: {
                    msg: 'Is active from cannot be null'
                },
                isDate: {
                    msg: 'Invalid date format for Is active from'
                }
            }
        },
        activeTill: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'active_till',
            validate: {
                isDate: {
                    msg: 'Invalid date format for Active till'
                }
            }
        },
        classType: {
            type: Sequelize.ENUM('lecture', 'tutorial', 'lab'),
            allowNull: false,
            field: 'class_type',
            validate: {
                notNull: {
                    msg: 'Class type cannot be null'
                }
            }
        },
        branchCourseSemesterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'branch_course_semester_id',
            references: {
                model: 'branch_course_semesters',
                key: 'branch_course_semester_id'
            },
            validate: {
                notNull: {
                    msg: 'Branch course semester ID cannot be null'
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
        modelName: 'Class',
        tableName: 'classes'
    }
);

export default Class;