import Joi from 'joi';


const createAttendance = {
    body: Joi.object().keys({
        classId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.base': 'Class ID must be a string',
                'string.guid': 'Class ID must be a valid UUID',
                'any.required': 'Class ID is required'
            }),
        date: Joi.string()
            .required()
            .custom((value, helpers) => {
                // Validate YYYY-MM-DD format using regex
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) {
                    throw new Error('Date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }

                return value;
            })
            .messages({
                'any.required': 'Date is required',
                'string.empty': 'Date cannot be empty',
                'string.base': 'Date must be a string'
            }),
    })
};


const addStudentsAttendance = {
    body: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            }),
        presentStudentIds: Joi.array()
            .items(Joi.string().uuid().messages({
                'string.guid': 'Each present student ID must be a valid UUID',
                'string.base': 'Each present student ID must be a string'
            }))
            .required()
            .messages({
                'any.required': 'Present student IDs are required',
                'array.base': 'Present student IDs must be an array'
            }),
        absentStudentIds: Joi.array()
            .items(Joi.string().uuid().messages({
                'string.guid': 'Each absent student ID must be a valid UUID',
                'string.base': 'Each absent student ID must be a string'
            }))
            .required()
            .messages({
                'any.required': 'Absent student IDs are required',
                'array.base': 'Absent student IDs must be an array'
            })
    }).custom((value, helpers) => {
        const presentSet = new Set(value.presentStudentIds);
        const absentSet = new Set(value.absentStudentIds);
        const duplicates = [...presentSet].filter(id => absentSet.has(id));

        if (duplicates.length > 0) {
            throw new Error(`These student IDs are in both present and absent lists: ${duplicates.join(', ')}`);
        }

        return value;
    })
};

// validations/attendance.validation.js
const updateStudentAttendance = {
    body: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            }),
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        newAttendanceStatus: Joi.boolean()
            .required()
            .messages({
                'boolean.base': 'New attendance status must be a boolean',
                'any.required': 'New attendance status is required'
            })
    })
};

const removeAttendance = {
    query: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string',
                'string.empty': 'Attendance ID cannot be empty'
            })
    })
};

// validations/attendance.validation.js
const getAttendanceOfAnyStudentForSpecificCourseInSemester = {
    query: Joi.object().keys({
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        courseId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'any.required': 'Course ID is required',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
                
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            })
    })
};

const getAttendanceOfSelfForSpecificCourseInSemester = {
    query: Joi.object().keys({
        courseId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'any.required': 'Course ID is required',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            })
    })
};

const getAttendanceOfAllForSemesterDivisionBatchCourse = {
    query: Joi.object().keys({
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        courseId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'string.base': 'Course ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            })
    })
};

// validations/attendance.validation.js
const sendAttendanceReport = {
    body: Joi.object().keys({
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            }),
        studentIds: Joi.array()
            .items(Joi.string().uuid().messages({
                'string.guid': 'Each student ID must be a valid UUID',
                'string.base': 'Each student ID must be a string'
            }))
            .optional()
            .messages({
                'array.base': 'Student IDs must be an array'
            }),
        courseIds: Joi.array()
            .items(Joi.string().uuid().messages({
                'string.guid': 'Each course ID must be a valid UUID',
                'string.base': 'Each course ID must be a string'
            }))
            .optional()
            .messages({
                'array.base': 'Course IDs must be an array'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            })
    }).custom((value, helpers) => {
        if (!value.studentIds && !value.courseIds && !value.semesterId) {
            throw new Error('At least one of studentIds, courseIds, or semesterId is required');
        }
        return value;
    })
};

// validations/attendance.validation.js
const getAttendance = {
    query: Joi.object().keys({
        date: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Date must be a string'
            }),
        attendanceId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'string.base': 'Attendance ID must be a string'
            }),
        classId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Class ID must be a valid UUID',
                'string.base': 'Class ID must be a string'
            }),
        studentId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'string.base': 'Student ID must be a string'
            }),
        courseId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            })
    })
};

const getActiveAttendanceSheet = {
    query: Joi.object().keys({
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'any.required': 'Division ID is required',
                'string.base': 'Division ID must be a string'
            })
    })
};



export default {
    createAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    removeAttendance,
    getAttendanceOfAnyStudentForSpecificCourseInSemester,
    getAttendanceOfSelfForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    sendAttendanceReport,
    getAttendance,
    getActiveAttendanceSheet
};
