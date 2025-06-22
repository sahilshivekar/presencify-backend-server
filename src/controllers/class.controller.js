import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Class from '../db/models/class.model.js';
import Room from '../db/models/room.model.js';
import Course from '../db/models/course.model.js';
import Staff from '../db/models/staff.model.js';
import Batch from '../db/models/batch.model.js';
import moment from 'moment';
import Timetable from '../db/models/timetable.model.js';
import Division from '../db/models/division.model.js';
import Semester from '../db/models/semester.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import Branch from '../db/models/branch.model.js';
import CancelledClass from '../db/models/cancelledClass.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import { sendNotification } from '../utils/firebaseCloudMessaging.js';
import StudentFCMToken from '../db/models/studentFCMToken.model.js';
import { getTimeInTwelveHourFormat } from '../utils/time.js';
import { fromYYYYMMDDToDDMMYYYY } from '../utils/date.js';
import StudentBatch from '../db/models/studentBatch.model.js';

const getYearFromSemesterNumber = (semesterNumber) => {
    if (semesterNumber === 1 || semesterNumber === 2) return 'FE'
    else if (semesterNumber === 3 || semesterNumber === 4) return 'SE'
    else if (semesterNumber === 5 || semesterNumber === 6) return 'TE'
    else if (semesterNumber === 7 || semesterNumber === 8) return 'BE'
    return "Invalid semester number"
}

const getThrowableConflictMessage = async (conflictType, conflictName) => {
    const conflitCourse = await Course.findByPk(conflictType.courseId)
    const conflictTimeTable = await Timetable.findByPk(conflictType.timetableId)
    const conflictInstructor = await Staff.findByPk(conflictType.instructorId)

    let conflictBatch = null;
    if (conflictType.classType != 'Lecture') {
        conflictBatch = await Batch.findByPk(conflictType.batchId)
    }

    const conflictDivision = await Division.findByPk(conflictTimeTable.divisionId)
    const conflictSemester = await Semester.findByPk(conflictDivision.semesterId)
    const conflictRoom = await Room.findByPk(conflictType.roomId)

    return `${conflictName} Prof. ${conflictInstructor.firstName} ${conflictInstructor.lastName} is already taking ${conflictType.classType.toLowerCase()} of '${conflitCourse.name}' on ${getYearFromSemesterNumber(conflictSemester.semesterNumber)} ${conflictBatch == null ? "Division" : "Batch"} ${conflictBatch == null ? conflictDivision.divisionCode : conflictBatch.batchCode} in room ${conflictRoom.roomNumber} between ${conflictType.startTime}-${conflictType.endTime} on ${conflictType.dayOfWeek}. (from ${conflictType.activeFrom} to ${conflictType.activeTill})`


}

const addClass = asyncHandler(async (req, res) => {
    const {
        instructorId,
        startTime,
        endTime,
        dayOfWeek,
        roomId,
        batchId,
        activeFrom,
        activeTill,
        classType,
        courseId,
        timetableId
    } = req.body;

    const requiredFields = {
        "Instructor ID": instructorId,
        "Start Time": startTime,
        "End Time": endTime,
        "Day of week": dayOfWeek,
        "Room ID": roomId,
        "Active From": activeFrom,
        "Active Till": activeTill,
        "Class Type": classType,
        "Course ID": courseId,
        "Timetable ID": timetableId
    }

    for (const fieldName in requiredFields) {
        if (!requiredFields[fieldName]) {
            throw new ApiError(400, `${fieldName} is required`)
        }
    }

    //!check if all id's exists in database
    const instructor = await Staff.findByPk(instructorId);

    if (!instructor) {
        throw new ApiError(404, "Instructor not found");
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const room = await Room.findByPk(roomId);

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    const timetable = await Timetable.findByPk(timetableId);

    if (!timetable) {
        throw new ApiError(404, "Timetable not found");
    }

    //!chekc if the class type is valid
    if (!['Lecture', 'Tutorial', 'Practical'].includes(classType)) {
        throw new ApiError(400, "Invalid class type. Must be 'Lecture', 'Tutorial' or 'Practical'");
    }

    //!check if batchId is provided when the class type is not lecture && class type is practical || tutorial
    let batch = null;
    if (classType == "Tutorial" || classType == "Practical") {
        if (!batchId) {
            throw new ApiError(400, "Batch information is required if class type is practical or tutorial");
        }
        batch = await Batch.findByPk(batchId);
        if (!batch) {
            throw new ApiError(404, "Batch not found");
        }

        if (batch.divisionId != timetable.divisionId) {
            throw new ApiError(400, "Batch doesn't belong to the same division as the timetable")
        }
    }

    //! check if the time is in correct format
    if (!moment(startTime, 'HH:mm:ss', true).isValid()) {
        throw new ApiError(400, "Invalid time format for start time");
    }
    if (!moment(endTime, 'HH:mm:ss', true).isValid()) {
        throw new ApiError(400, "Invalid time format for end time");
    }

    if (startTime > endTime) {
        throw new ApiError(400, "Start time should be before end time");
    }

    //!check if active from is less than active till
    if (!moment(activeFrom, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format for active from field");
    }
    if (!moment(activeTill, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format for active till field");
    }

    if (activeFrom > activeTill) {
        throw new ApiError(400, "Active from date should be before active till date");
    }


    //!check if the course is available for that particular semester number in that branch (also for the optoinal course condition)
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)
    const branch = await Branch.findByPk(semester.branchId)

    const checkCourseAvailableForSpecificSemester = await BranchCourseSemester.findOne({
        where: {
            courseId: courseId,
            semesterNumber: semester.semesterNumber,
            branchId: semester.branchId
        }
    })

    if (!checkCourseAvailableForSpecificSemester) {
        throw new ApiError(400, `Course '${course.name}' is not in syllabus for semester ${semester.semesterNumber} of branch ${branch.name}`)
    }

    //!check if dates are in bounds of semesters dates
    if (activeFrom < semester.startDate || activeFrom > semester.endDate) {
        throw new ApiError(400, `Active from date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    if (activeTill > semester.endDate || activeTill < semester.startDate) {
        throw new ApiError(400, `Active till date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    //!check if instructor is teaching at diff class at same time
    const instructorConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { instructorId: instructorId }, // same instructor
                { isExtraClass: false },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        {
                            startTime: {
                                [Op.gt]: startTime, // Existing class starts inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            endTime: {
                                [Op.gt]: startTime,  // Existing class ends inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            startTime: {
                                [Op.lte]: startTime // Existing class fully contains the new class
                            },
                            endTime: {
                                [Op.gte]: endTime // Existing class fully contains the new class
                            }
                        }
                    ],
                },
                {
                    [Op.or]: [
                        {
                            activeFrom: {
                                [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeTill: {
                                [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeFrom: {
                                [Op.lte]: activeFrom  // Existing class fully contains the new class
                            },
                            activeTill: {
                                [Op.gte]: activeTill
                            }
                        }
                    ],
                }
            ]
        }
    })

    if (instructorConflict) {
        const msg = await getThrowableConflictMessage(instructorConflict, "Instructor unavailable at this time: ")
        throw new ApiError(400, msg)
    }

    //!check if at the same time there is only one class going on in a room
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { roomId: roomId }, // same room
                { isExtraClass: false },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        {
                            startTime: {
                                [Op.gt]: startTime, // Existing class starts inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            endTime: {
                                [Op.gt]: startTime,  // Existing class ends inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            startTime: {
                                [Op.lte]: startTime // Existing class fully contains the new class
                            },
                            endTime: {
                                [Op.gte]: endTime // Existing class fully contains the new class
                            }
                        }
                    ]
                },
                {
                    [Op.or]: [
                        {
                            activeFrom: {
                                [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeTill: {
                                [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeFrom: {
                                [Op.lte]: activeFrom  // Existing class fully contains the new class
                            },
                            activeTill: {
                                [Op.gte]: activeTill
                            }
                        }
                    ]
                }
            ]
        }
    })

    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(400, msg)
    }


    //!check if at the same time there is another class going on for same division
    if (batch == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId }, // same division
                    { isExtraClass: false },
                    { dayOfWeek: dayOfWeek },
                    // { classType: "Lecture" },
                    {
                        [Op.or]: [
                            {
                                startTime: {
                                    [Op.gt]: startTime, // Existing class starts inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                endTime: {
                                    [Op.gt]: startTime,  // Existing class ends inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                startTime: {
                                    [Op.lte]: startTime // Existing class fully contains the new class
                                },
                                endTime: {
                                    [Op.gte]: endTime // Existing class fully contains the new class
                                }
                            }
                        ],
                    },
                    {
                        [Op.or]: [
                            {
                                activeFrom: {
                                    [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeTill: {
                                    [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeFrom: {
                                    [Op.lte]: activeFrom  // Existing class fully contains the new class
                                },
                                activeTill: {
                                    [Op.gte]: activeTill
                                }
                            }
                        ],
                    }
                ]
            }
        })

        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(400, msg)
        }
    }

    //!check if at the same time there is another practical added for same batch

    if (batch != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId }, // same division
                    { isExtraClass: false },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null }, // no batch means a lecture is going on
                                { [Op.eq]: batchId } // same batch's practical is going on
                            ]
                        }
                    },
                    { dayOfWeek: dayOfWeek },
                    // {
                    //     classType: {
                    //         [Op.in]: ["Tutorial", "Practical"]
                    //     }
                    // },
                    {
                        [Op.or]: [
                            {
                                startTime: {
                                    [Op.gt]: startTime, // Existing class starts inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                endTime: {
                                    [Op.gt]: startTime,  // Existing class ends inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                startTime: {
                                    [Op.lte]: startTime // Existing class fully contains the new class
                                },
                                endTime: {
                                    [Op.gte]: endTime // Existing class fully contains the new class
                                }
                            }
                        ]
                    },
                    {
                        [Op.or]: [
                            {
                                activeFrom: {
                                    [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeTill: {
                                    [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeFrom: {
                                    [Op.lte]: activeFrom  // Existing class fully contains the new class
                                },
                                activeTill: {
                                    [Op.gte]: activeTill
                                }
                            }
                        ]
                    }
                ]

            }
        })

        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(400, msg)
        }
    }


    const classObj = await Class.create(
        {
            instructorId: instructorId || null,
            startTime: startTime || null,
            endTime: endTime || null,
            dayOfWeek: dayOfWeek || null,
            roomId: roomId || null,
            batchId: batchId || null,
            activeFrom: activeFrom || null,
            activeTill: activeTill || null,
            classType: classType || null,
            courseId: courseId || null,
            timetableId: timetableId || null
        }
    );

    res.status(201).json(new ApiResponse(201, "Class added successfully", classObj));
});

const getClasses = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        timetableId,
        divisionId,
        startTime,
        endTime,
        activeFrom,
        activeTill,
        instructorId,
        dayOfWeek,
        roomId,
        batchId,
        classType,
        courseId,
        semesterId,
        isExtraClass,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const classes = await Class.findAndCountAll({
        where: {
            [Op.and]: [
                ...(timetableId ? [{ timetableId: timetableId }] : []),
                ...(startTime ? [{ startTime: { [Op.gte]: startTime } }] : []),
                ...(endTime ? [{ endTime: { [Op.lte]: endTime } }] : []),
                ...(activeFrom ? [{ activeFrom: { [Op.gte]: activeFrom } }] : []),
                ...(activeTill ? [{ activeTill: { [Op.lte]: activeTill } }] : []),
                ...(instructorId ? [{ instructorId: instructorId }] : []),
                ...(dayOfWeek ? [{ dayOfWeek: dayOfWeek }] : []),
                ...(roomId ? [{ roomId: roomId }] : []),
                ...(batchId ? [{ batchId: batchId }] : []),
                ...(classType ? [{ classType: classType }] : []),
                ...(isExtraClass == "true" ? [{ isExtraClass: true }] : []),
            ]
        },
        include: [
            {
                model: Course,
                required: true,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(searchQuery ? [{ name: { [Op.iLike]: `%${searchQuery}%` } }] : []),
                        ...(courseId ? [{ id: courseId }] : [])
                    ]
                }
            },
            {
                model: Timetable,
                required: true,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(divisionId ? [{ divisionId: divisionId }] : []),
                    ]
                },
                include: [
                    {
                        model: Division,
                        required: true,
                        duplicating: false,
                        include: [
                            {
                                model: Semester,
                                required: true,
                                duplicating: false,
                                where: {
                                    [Op.and]: [
                                        ...(semesterId ? [{ id: semesterId }] : []),
                                    ]
                                },
                                include: [
                                    {
                                        model: Branch,
                                        required: true,
                                        duplicating: false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: Batch,
                required: false,
                duplicating: false,
            },
            {
                model: Staff,
                required: true,
                duplicating: false
            }
        ],
        offset: offset,
        limit: limit
    })

    res.status(200).json(new ApiResponse(200, "Classes retrieved successfully.", {
        classes: classes.rows,
        totalCount: classes.count
    }));
});

const getClassById = asyncHandler(async (req, res) => {
    const { classId } = req.query;

    if (!classId) {
        throw new ApiError(400, "Class id is required");
    }

    const classObj = await Class.findByPk(
        classId,
        {
            include: [
                {
                    model: Course,
                    required: true,
                    duplicating: false
                },
                {
                    model: Timetable,
                    required: true,
                    duplicating: false,
                    include: [
                        {
                            model: Division,
                            required: true,
                            duplicating: false,
                            include: [
                                {
                                    model: Semester,
                                    required: true,
                                    duplicating: false,
                                    include: [
                                        {
                                            model: Branch,
                                            required: true,
                                            duplicating: false
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Batch,
                    required: false,
                    duplicating: false,
                },
                {
                    model: Staff,
                    required: true,
                    duplicating: false
                }
            ]
        })

    if (!classObj) throw new ApiError(404, "Class not found");

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Class fetched successfully",
                classObj
            )
        );
});

const extendActiveTillDateOfClass = asyncHandler(async (req, res) => {
    const {
        classId,
        newActiveTill,
    } = req.body;

    //!check if active from is less than active till
    if (!classId) {
        throw new ApiError(400, "Class id is required");
    }

    const classObj = await Class.findByPk(classId);

    const timetable = await Timetable.findByPk(classObj.timetableId)
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)

    if (!classObj) throw new ApiError(404, "Class not found");

    if (newActiveTill) {
        if (!moment(newActiveTill, 'YYYY-MM-DD', true).isValid()) {
            throw new ApiError(400, "Invalid date format for active till field");
        }

        if (newActiveTill <= classObj.activeTill) {
            throw new ApiError(400, "New active till date should be after the old active till date");
        }
        if (newActiveTill > semester.endDate) {
            throw new ApiError(400, "New active till date should be before the semester end date");
        }
        classObj.activeTill = newActiveTill;
    }

    //!check if at the same time there is only one class going on in a room
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { id: { [Op.ne]: classObj.id } }, // not the same class
                { roomId: classObj.roomId }, // same room
                { dayOfWeek: classObj.dayOfWeek },
                {
                    [Op.or]: [
                        {
                            startTime: {
                                [Op.gt]: classObj.startTime, // Existing class starts inside the new class
                                [Op.lt]: classObj.endTime
                            }
                        },
                        {
                            endTime: {
                                [Op.gt]: classObj.startTime,  // Existing class ends inside the new class
                                [Op.lt]: classObj.endTime
                            }
                        },
                        {
                            startTime: {
                                [Op.lte]: classObj.startTime // Existing class fully contains the new class
                            },
                            endTime: {
                                [Op.gte]: classObj.endTime // Existing class fully contains the new class   
                            }
                        }
                    ]
                },
                {
                    [Op.or]: [
                        {
                            activeFrom: {
                                [Op.gte]: classObj.activeFrom,  // Existing class starts inside the new class period
                                [Op.lte]: classObj.activeTill
                            }
                        },
                        {
                            activeTill: {
                                [Op.gte]: classObj.activeFrom,  // Existing class ends inside the new class period
                                [Op.lte]: classObj.activeTill
                            }
                        },
                        {
                            activeFrom: {
                                [Op.lte]: classObj.activeFrom  // Existing class fully contains the new class
                            },
                            activeTill: {
                                [Op.gte]: classObj.activeTill
                            }
                        }
                    ]
                }
            ]
        }
    })

    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(400, msg)
    }


    //!check if at the same time there is another class going on for same division
    if (classObj.batchId == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: classObj.id } },
                    { timetableId: classObj.timetableId }, // same division
                    { dayOfWeek: classObj.dayOfWeek },
                    // { classType: "Lecture" },
                    {
                        [Op.or]: [
                            {
                                startTime: {
                                    [Op.gt]: classObj.startTime, // Existing class starts inside the new class
                                    [Op.lt]: classObj.endTime
                                }
                            },
                            {
                                endTime: {
                                    [Op.gt]: classObj.startTime,  // Existing class ends inside the new class
                                    [Op.lt]: classObj.endTime
                                }
                            },
                            {
                                startTime: {
                                    [Op.lte]: classObj.startTime // Existing class fully contains the new class
                                },
                                endTime: {
                                    [Op.gte]: classObj.endTime // Existing class fully contains the new class   
                                }
                            }
                        ]
                    },
                    {
                        [Op.or]: [
                            {
                                activeFrom: {
                                    [Op.gte]: classObj.activeFrom,  // Existing class starts inside the new class period
                                    [Op.lte]: classObj.activeTill
                                }
                            },
                            {
                                activeTill: {
                                    [Op.gte]: classObj.activeFrom,  // Existing class ends inside the new class period
                                    [Op.lte]: classObj.activeTill
                                }
                            },
                            {
                                activeFrom: {
                                    [Op.lte]: classObj.activeFrom  // Existing class fully contains the new class
                                },
                                activeTill: {
                                    [Op.gte]: classObj.activeTill
                                }
                            }
                        ]
                    }
                ]
            }
        })

        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(400, msg)
        }
    }

    //!check if at the same time there is another practical added for same batch

    if (classObj.batchId != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: classObj.id } },
                    { timetableId: classObj.timetableId }, // same division
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null }, // no batch means a lecture is going on
                                { [Op.eq]: classObj.batchId } // same batch's practical is going on
                            ]
                        }
                    },
                    { dayOfWeek: classObj.dayOfWeek },
                    // {
                    //     classType: {
                    //         [Op.in]: ["Tutorial", "Practical"]
                    //     }
                    // },
                    {
                        [Op.or]: [
                            {
                                startTime: {
                                    [Op.gt]: classObj.startTime, // Existing class starts inside the new class
                                    [Op.lt]: classObj.endTime
                                }
                            },
                            {
                                endTime: {
                                    [Op.gt]: classObj.startTime,  // Existing class ends inside the new class
                                    [Op.lt]: classObj.endTime
                                }
                            },
                            {
                                startTime: {
                                    [Op.lte]: classObj.startTime // Existing class fully contains the new class
                                },
                                endTime: {
                                    [Op.gte]: classObj.endTime // Existing class fully contains the new class   
                                }
                            }
                        ]
                    },
                    {
                        [Op.or]: [
                            {
                                activeFrom: {
                                    [Op.gte]: classObj.activeFrom,  // Existing class starts inside the new class period
                                    [Op.lte]: classObj.activeTill
                                }
                            },
                            {
                                activeTill: {
                                    [Op.gte]: classObj.activeFrom,  // Existing class ends inside the new class period
                                    [Op.lte]: classObj.activeTill
                                }
                            },
                            {
                                activeFrom: {
                                    [Op.lte]: classObj.activeFrom  // Existing class fully contains the new class
                                },
                                activeTill: {
                                    [Op.gte]: classObj.activeTill
                                }
                            }
                        ]
                    }
                ]

            }
        })

        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(400, msg)
        }
    }

    await classObj.save()
    res.status(200).json(new ApiResponse(200, "Class updated successfully", classObj));
});

const removeClass = asyncHandler(async (req, res) => {
    const { classId } = req.query;

    if (!classId) {
        throw new ApiError(400, "Class id is required");
    }

    const classObj = await Class.findByPk(classId);

    if (!classObj) throw new ApiError(404, "Class not found");

    await classObj.destroy();

    res.status(200).json(new ApiResponse(200, "Class deleted successfully", null));
});



const addExtraClass = asyncHandler(async (req, res) => {
    const {
        instructorId,
        startTime,
        endTime,
        dayOfWeek, // sometimes extra class can be on every specific day for some days if active From and active till of extra class is not same
        roomId,
        batchId,
        activeFrom,
        activeTill, // will be same as active from if extra class is only for one day
        classType,
        courseId,
        timetableId
    } = req.body;

    const requiredFields = {
        "Instructor ID": instructorId,
        "Start Time": startTime,
        "End Time": endTime,
        "Day of week": dayOfWeek,
        "Room ID": roomId,
        "Active From": activeFrom,
        "Active Till": activeTill,
        "Class Type": classType,
        "Course ID": courseId,
        "Timetable ID": timetableId
    }

    for (const fieldName in requiredFields) {
        if (!requiredFields[fieldName]) {
            throw new ApiError(400, `${fieldName} is required`)
        }
    }

    //!check if all id's exists in database
    const instructor = await Staff.findByPk(instructorId);

    if (!instructor) {
        throw new ApiError(404, "Instructor not found");
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const room = await Room.findByPk(roomId);

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    const timetable = await Timetable.findByPk(timetableId);

    if (!timetable) {
        throw new ApiError(404, "Timetable not found");
    }

    //!chekc if the class type is valid
    if (!['Lecture', 'Tutorial', 'Practical'].includes(classType)) {
        throw new ApiError(400, "Invalid class type. Must be 'Lecture', 'Tutorial' or 'Practical'");
    }

    //!check if batchId is provided when the class type is not lecture && class type is practical || tutorial
    let batch = null;
    if (classType == "Tutorial" || classType == "Practical") {
        if (!batchId) {
            throw new ApiError(400, "Batch information is required if class type is practical or tutorial");
        }
        batch = await Batch.findByPk(batchId);
        if (!batch) {
            throw new ApiError(404, "Batch not found");
        }

        if (batch.divisionId != timetable.divisionId) {
            throw new ApiError(400, "Batch doesn't belong to the same division as the timetable")
        }
    }

    //! check if the time is in correct format
    if (!moment(startTime, 'HH:mm:ss', true).isValid()) {
        throw new ApiError(400, "Invalid time format for start time");
    }
    if (!moment(endTime, 'HH:mm:ss', true).isValid()) {
        throw new ApiError(400, "Invalid time format for end time");
    }

    if (startTime > endTime) {
        throw new ApiError(400, "Start time should be before end time");
    }

    //!check if active from is less than active till
    if (!moment(activeFrom, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format for active from field");
    }
    if (!moment(activeTill, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format for active till field");
    }

    if (activeFrom > activeTill) {
        throw new ApiError(400, "Active from date should be before active till date");
    }


    //!check if the course is available for that particular semester number in that branch (also for the optoinal course condition)
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)
    const branch = await Branch.findByPk(semester.branchId)

    const checkCourseAvailableForSpecificSemester = await BranchCourseSemester.findOne({
        where: {
            courseId: courseId,
            semesterNumber: semester.semesterNumber,
            branchId: semester.branchId
        }
    })

    if (!checkCourseAvailableForSpecificSemester) {
        throw new ApiError(400, `Course '${course.name}' is not in syllabus for semester ${semester.semesterNumber} of branch ${branch.name}`)
    }

    //!check if dates are in bounds of semesters dates
    if (activeFrom < semester.startDate || activeFrom > semester.endDate) {
        throw new ApiError(400, `Active from date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    if (activeTill > semester.endDate || activeTill < semester.startDate) {
        throw new ApiError(400, `Active till date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }


    //!check if instructor is teaching at diff class at same time
    const instructorConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { instructorId: instructorId }, // same instructor
                { dayOfWeek: dayOfWeek },
                { isExtraClass: true },
                {
                    [Op.or]: [
                        {
                            startTime: {
                                [Op.gt]: startTime, // Existing class starts inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            endTime: {
                                [Op.gt]: startTime,  // Existing class ends inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            startTime: {
                                [Op.lte]: startTime // Existing class fully contains the new class
                            },
                            endTime: {
                                [Op.gte]: endTime // Existing class fully contains the new class
                            }
                        }
                    ],
                },
                {
                    [Op.or]: [
                        {
                            activeFrom: {
                                [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeTill: {
                                [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeFrom: {
                                [Op.lte]: activeFrom  // Existing class fully contains the new class
                            },
                            activeTill: {
                                [Op.gte]: activeTill
                            }
                        }
                    ],
                }
            ]
        }
    })


    if (instructorConflict) {
        const msg = await getThrowableConflictMessage(instructorConflict, "Instructor unavailable at this time: ")
        throw new ApiError(400, msg)
    }

    //!check if at the same time there is only one class going on in a room
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { roomId: roomId }, // same room
                { isExtraClass: true },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        {
                            startTime: {
                                [Op.gt]: startTime, // Existing class starts inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            endTime: {
                                [Op.gt]: startTime,  // Existing class ends inside the new class
                                [Op.lt]: endTime
                            }
                        },
                        {
                            startTime: {
                                [Op.lte]: startTime // Existing class fully contains the new class
                            },
                            endTime: {
                                [Op.gte]: endTime // Existing class fully contains the new class
                            }
                        }
                    ]
                },
                {
                    [Op.or]: [
                        {
                            activeFrom: {
                                [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeTill: {
                                [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                [Op.lte]: activeTill
                            }
                        },
                        {
                            activeFrom: {
                                [Op.lte]: activeFrom  // Existing class fully contains the new class
                            },
                            activeTill: {
                                [Op.gte]: activeTill
                            }
                        }
                    ]
                }
            ]
        }
    })

    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(400, msg)
    }


    //!check if at the same time there is another class going on for same division
    if (batch == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId }, // same division
                    { isExtraClass: true },
                    { dayOfWeek: dayOfWeek },
                    // { classType: "Lecture" },
                    {
                        [Op.or]: [
                            {
                                startTime: {
                                    [Op.gt]: startTime, // Existing class starts inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                endTime: {
                                    [Op.gt]: startTime,  // Existing class ends inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                startTime: {
                                    [Op.lte]: startTime // Existing class fully contains the new class
                                },
                                endTime: {
                                    [Op.gte]: endTime // Existing class fully contains the new class
                                }
                            }
                        ],
                    },
                    {
                        [Op.or]: [
                            {
                                activeFrom: {
                                    [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeTill: {
                                    [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeFrom: {
                                    [Op.lte]: activeFrom  // Existing class fully contains the new class
                                },
                                activeTill: {
                                    [Op.gte]: activeTill
                                }
                            }
                        ],
                    }
                ]
            }
        })

        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(400, msg)
        }
    }


    //!check if at the same time there is another practical added for same batch

    if (batch != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId }, // same division
                    { isExtraClass: true },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null }, // no batch means a lecture is going on
                                { [Op.eq]: batchId } // same batch's practical is going on
                            ]
                        }
                    },
                    { dayOfWeek: dayOfWeek },
                    // {
                    //     classType: {
                    //         [Op.in]: ["Tutorial", "Practical"]
                    //     }
                    // },
                    {
                        [Op.or]: [
                            {
                                startTime: {
                                    [Op.gt]: startTime, // Existing class starts inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                endTime: {
                                    [Op.gt]: startTime,  // Existing class ends inside the new class
                                    [Op.lt]: endTime
                                }
                            },
                            {
                                startTime: {
                                    [Op.lte]: startTime // Existing class fully contains the new class
                                },
                                endTime: {
                                    [Op.gte]: endTime // Existing class fully contains the new class
                                }
                            }
                        ]
                    },
                    {
                        [Op.or]: [
                            {
                                activeFrom: {
                                    [Op.gte]: activeFrom,  // Existing class starts inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeTill: {
                                    [Op.gte]: activeFrom,  // Existing class ends inside the new class period
                                    [Op.lte]: activeTill
                                }
                            },
                            {
                                activeFrom: {
                                    [Op.lte]: activeFrom  // Existing class fully contains the new class
                                },
                                activeTill: {
                                    [Op.gte]: activeTill
                                }
                            }
                        ]
                    }
                ]

            }
        })

        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(400, msg)
        }
    }

    const classObj = await Class.create(
        {
            instructorId: instructorId || null,
            startTime: startTime || null,
            endTime: endTime || null,
            dayOfWeek: dayOfWeek || null,
            roomId: roomId || null,
            batchId: batchId || null,
            activeFrom: activeFrom || null,
            activeTill: activeTill || null,
            classType: classType || null,
            courseId: courseId || null,
            timetableId: timetableId || null,
            isExtraClass: true
        }
    );

    let studentsToNotify = []
    if (batch) {
        studentsToNotify = await StudentBatch.findAll({
            where: {
                batchId: batch.id,
                endDate: null
            }
        })
    } else {
        studentsToNotify = await StudentDivision.findAll({
            where: {
                divisionId: timetable.divisionId,
                endDate: null
            }
        })
    }

    studentsToNotify = studentsToNotify.map(student => student.studentId)

    const studentsWithFCMToken = await StudentFCMToken.findAll({
        where: {
            studentId: {
                [Op.in]: studentsToNotify
            }
        }
    })

    studentsWithFCMToken.forEach(studentWithFCMToken => {
        sendNotification(
            studentWithFCMToken.fcmToken,
            "Extra lecture added",
            `Extra lecture from ${getTimeInTwelveHourFormat(classObj.startTime)} to ${getTimeInTwelveHourFormat(classObj.endTime)} on ${classObj.dayOfWeek} of ${course.name} is sheduled`,
            {
                type: "ExtraLectureAdded",
                classId: classObj.id,
            }
        )
    })

    res.status(201).json(new ApiResponse(201, "Class added successfully", classObj));

})


const cancelClass = asyncHandler(async (req, res) => {
    const {
        classId,
        reason,
        date
    } = req.body;

    if (!date) {
        throw new ApiError(400, "Date is required");
    }

    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format");
    }

    if (!classId) {
        throw new ApiError(400, "Class id is required");
    }

    const classObj = await Class.findByPk(classId);

    if (!classObj) throw new ApiError(404, "Class not found");

    if (date > classObj.activeTill || date < classObj.activeFrom) {
        throw new ApiError(400, "Date is not in bounds of active from and active till of class");
    }

    const isAlreadyCancelled = await CancelledClass.findOne({
        where: {
            classId: classId,
            date: date
        }
    })

    if (isAlreadyCancelled) {
        throw new ApiError(400, "Class is already cancelled")
    }

    await CancelledClass.create(
        {
            classId: classId,
            date: date,
            reason: reason || null
        }
    );


    //! sending notification to the students
    let studentsToNotify = []
    let batch = null;
    if (classObj.batchId) {
        batch = await Batch.findByPk(classObj.batchId);
    }
    const timetable = await Timetable.findByPk(classObj.timetableId);
    const course = await Course.findByPk(classObj.courseId);


    if (batch) {
        studentsToNotify = await StudentBatch.findAll({
            where: {
                batchId: batch.id,
                endDate: null
            }
        })
    } else {
        studentsToNotify = await StudentDivision.findAll({
            where: {
                divisionId: timetable.divisionId,
                endDate: null
            }
        })
    }

    studentsToNotify = studentsToNotify.map(student => student.studentId)

    const studentsWithFCMToken = await StudentFCMToken.findAll({
        where: {
            studentId: {
                [Op.in]: studentsToNotify
            }
        }
    })

    studentsWithFCMToken.forEach(studentWithFCMToken => {
        sendNotification(
            studentWithFCMToken.fcmToken,
            "Lecture cancelled",
            `Lecture of ${course.name} from ${classObj.startTime} to ${classObj.endTime} on ${fromYYYYMMDDToDDMMYYYY(date)} is cancelled`,
            {
                type: "LectureCancelled",
                classId: classObj.id,
                cancelDate: fromYYYYMMDDToDDMMYYYY(date)
            }
        )
    })

    res.status(200).json(new ApiResponse(200, "Class marked as cancelled successfully", null));
});


// should check for the division and batch too
const getCancelledClasses = asyncHandler(async (req, res) => {
    const {
        divisionId,  // must provide either division or batch
        batchId,
        date,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);


    if (date && !moment(date, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format");
    }

    let timetableOfDivision = null
    if (divisionId) {
        timetableOfDivision = await Timetable.findOne({
            where: {
                divisionId: divisionId
            }
        })
        if (!timetableOfDivision) {
            throw new ApiError(404, "Timetable not found")
        }
    }

    const cancelledClasses = await CancelledClass.findAndCountAll({
        where: {
            [Op.and]: [
                ...(date ? [{ date: date }] : [])
            ]
        },
        include: [
            {
                model: Class,
                required: divisionId || batchId ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(divisionId ? [{ timetableId: timetableOfDivision.id }] : []),
                        ...(batchId ? [{ batchId: batchId }] : [])
                    ]
                }
            }
        ],
        offset: offset,
        limit: parseInt(limit, 10)
    })

    res.status(200).json(new ApiResponse(200, "Cancelled classes retrieved successfully.", {
        cancelledClasses: cancelledClasses.rows,
        totalCount: cancelledClasses.count
    }));
});


export {
    addClass,
    getClasses,
    getClassById,
    extendActiveTillDateOfClass,
    removeClass,
    addExtraClass,
    getCancelledClasses,
    cancelClass
}   