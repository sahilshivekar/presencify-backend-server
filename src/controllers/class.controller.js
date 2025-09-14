import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Class from '../db/models/class.model.js';
import Room from '../db/models/room.model.js';
import Course from '../db/models/course.model.js';
import Teacher from '../db/models/teacher.model.js';
import Batch from '../db/models/batch.model.js';
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
import TeacherTeachesCourse from '../db/models/teacherTeachesCourse.model.js';
import httpStatus from 'http-status';
import { getDateStringFromObj } from '../utils/date.js';

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
    const conflictTeacher = await Teacher.findByPk(conflictType.teacherId)

    let conflictBatch = null;
    if (conflictType.classType != 'Lecture') {
        conflictBatch = await Batch.findByPk(conflictType.batchId)
    }

    const conflictDivision = await Division.findByPk(conflictTimeTable.divisionId)
    const conflictSemester = await Semester.findByPk(conflictDivision.semesterId)
    const conflictRoom = await Room.findByPk(conflictType.roomId)

    return `${conflictName} Prof. ${conflictTeacher.firstName} ${conflictTeacher.lastName} is already taking ${conflictType.classType.toLowerCase()} of '${conflitCourse.name}' on ${getYearFromSemesterNumber(conflictSemester.semesterNumber)} ${conflictBatch == null ? "Division" : "Batch"} ${conflictBatch == null ? conflictDivision.divisionCode : conflictBatch.batchCode} in room ${conflictRoom.roomNumber} between ${conflictType.startTime}-${conflictType.endTime} on ${conflictType.dayOfWeek}. (from ${conflictType.activeFrom} to ${conflictType.activeTill})`
}

// Input validation for required fields, types, and formats is handled by @class.validation.js

const addClass = asyncHandler(async (req, res) => {
    const {
        teacherId,
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

    // Only check for DB existence and business logic, not input validation

    // Check if all referenced IDs exist in the database
    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const course = await Course.findByPk(courseId);
    if (!course) throw new ApiError(httpStatus.NOT_FOUND, "Course not found");

    const room = await Room.findByPk(roomId);
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");

    // Check batch only for practical/tutorial
    let batch = null;
    if (classType === "Tutorial" || classType === "Practical") {
        batch = await Batch.findByPk(batchId);
        if (!batch) throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
        if (batch.divisionId != timetable.divisionId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Batch doesn't belong to the same division as the timetable")
        }
    }

    // Check if the course is available for that particular semester number in that branch
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
        throw new ApiError(httpStatus.BAD_REQUEST, `Course '${course.name}' is not in syllabus for semester ${semester.semesterNumber} of branch ${branch.name}`)
    }
    
    // Check if dates are in bounds of semester dates
    if (activeFrom < semester.startDate || activeFrom > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active from date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }
    if (activeTill < semester.startDate || activeTill > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active till date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    // Check if teacher teaches the course
    const teacherTeachesCourse = await TeacherTeachesCourse.findOne({
        where: {
            teacherId: teacherId,
            courseId: courseId
        }
    })
    if (!teacherTeachesCourse) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Teacher is not teaching this course")
    }

    // Check for teacher conflict
    const teacherConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { teacherId: teacherId },
                { isExtraClass: false },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (teacherConflict) {
        const msg = await getThrowableConflictMessage(teacherConflict, "Teacher unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for room conflict
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { roomId: roomId },
                { isExtraClass: false },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for division conflict (lecture)
    if (batch == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: false },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    // Check for batch conflict (practical/tutorial)
    if (batch != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: false },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null },
                                { [Op.eq]: batchId }
                            ]
                        }
                    },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    const classObj = await Class.create(
        {
            teacherId: teacherId || null,
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

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Class added successfully", classObj));
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
        teacherId,
        dayOfWeek,
        roomId,
        batchId,
        classType,
        courseId,
        semesterId,
        isExtraClass,
        page = 1,
        limit = 10,
        getAll = false,
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
                ...(teacherId ? [{ teacherId: teacherId }] : []),
                ...(dayOfWeek ? [{ dayOfWeek: dayOfWeek }] : []),
                ...(roomId ? [{ roomId: roomId }] : []),
                ...(batchId ? [{ batchId: batchId }] : []),
                ...(classType ? [{ classType: classType }] : []),
                ...(isExtraClass === true ? [{ isExtraClass: true }] : []),
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
                model: Teacher,
                required: true,
                duplicating: false
            }
        ],
        ...(limit && getAll === false ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit: parseInt(limit, 10) } : {})
    })

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Classes retrieved successfully.", {
        classes: classes.rows,
        totalCount: classes.count
    }));
});

const getClassById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation for id is handled by @class.validation.js

    const classObj = await Class.findByPk(
        id,
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
                    model: Teacher,
                    required: true,
                    duplicating: false
                }
            ]
        })

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Class fetched successfully",
                classObj
            )
        );
});

const extendActiveTillDateOfClass = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newActiveTill } = req.body;

    // Input validation for id and newActiveTill is handled by @class.validation.js

    const classObj = await Class.findByPk(id);

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    const timetable = await Timetable.findByPk(classObj.timetableId)
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)

    if (newActiveTill) {
        if (newActiveTill <= classObj.activeTill) {
            throw new ApiError(httpStatus.BAD_REQUEST, "New active till date should be after the old active till date");
        }
        if (newActiveTill > semester.endDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, "New active till date should be before the semester end date");
        }
        classObj.activeTill = newActiveTill;
    }

    // Check for room conflict
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { id: { [Op.ne]: classObj.id } },
                { roomId: classObj.roomId },
                { dayOfWeek: classObj.dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                        { endTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                        { startTime: { [Op.lte]: classObj.startTime }, endTime: { [Op.gte]: classObj.endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                        { activeTill: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                        { activeFrom: { [Op.lte]: classObj.activeFrom }, activeTill: { [Op.gte]: classObj.activeTill } }
                    ]
                }
            ]
        }
    })
    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for division conflict (lecture)
    if (classObj.batchId == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: classObj.id } },
                    { timetableId: classObj.timetableId },
                    { dayOfWeek: classObj.dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { endTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { startTime: { [Op.lte]: classObj.startTime }, endTime: { [Op.gte]: classObj.endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeTill: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeFrom: { [Op.lte]: classObj.activeFrom }, activeTill: { [Op.gte]: classObj.activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    // Check for batch conflict (practical/tutorial)
    if (classObj.batchId != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: classObj.id } },
                    { timetableId: classObj.timetableId },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null },
                                { [Op.eq]: classObj.batchId }
                            ]
                        }
                    },
                    { dayOfWeek: classObj.dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { endTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { startTime: { [Op.lte]: classObj.startTime }, endTime: { [Op.gte]: classObj.endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeTill: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeFrom: { [Op.lte]: classObj.activeFrom }, activeTill: { [Op.gte]: classObj.activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    await classObj.save()
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Class updated successfully", classObj));
});

const removeClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation for id is handled by @class.validation.js

    const classObj = await Class.findByPk(id);

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    await classObj.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Class deleted successfully", null));
});

const addExtraClass = asyncHandler(async (req, res) => {
    const {
        teacherId,
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

    // Only check for DB existence and business logic, not input validation

    // Check if all referenced IDs exist in the database
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");

    const course = await Course.findByPk(courseId);
    if (!course) throw new ApiError(httpStatus.NOT_FOUND, "Course not found");

    const room = await Room.findByPk(roomId);
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");

    // Check batch only for practical/tutorial
    let batch = null;
    if (classType === "Tutorial" || classType === "Practical") {
        batch = await Batch.findByPk(batchId);
        if (!batch) throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
        if (batch.divisionId != timetable.divisionId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Batch doesn't belong to the same division as the timetable")
        }
    }

    // Check if the course is available for that particular semester number in that branch
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
        throw new ApiError(httpStatus.BAD_REQUEST, `Course '${course.name}' is not in syllabus for semester ${semester.semesterNumber} of branch ${branch.name}`)
    }

    // Check if dates are in bounds of semester dates
    if (activeFrom < semester.startDate || activeFrom > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active from date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }
    if (activeTill > semester.endDate || activeTill < semester.startDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active till date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    // Check for teacher conflict
    const teacherConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { teacherId: teacherId },
                { dayOfWeek: dayOfWeek },
                { isExtraClass: true },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (teacherConflict) {
        const msg = await getThrowableConflictMessage(teacherConflict, "Teacher unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for room conflict
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { roomId: roomId },
                { isExtraClass: true },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for division conflict (lecture)
    if (batch == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: true },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    // Check for batch conflict (practical/tutorial)
    if (batch != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: true },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null },
                                { [Op.eq]: batchId }
                            ]
                        }
                    },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    const classObj = await Class.create(
        {
            teacherId: teacherId || null,
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

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Class added successfully", classObj));
})

const cancelClass = asyncHandler(async (req, res) => {
    const {
        classId,
        reason,
        date
    } = req.body;

    // Input validation for classId and date is handled by @class.validation.js

    const classObj = await Class.findByPk(classId);

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    // Joi may coerce date to a Date object; normalize to 'YYYY-MM-DD' for lexicographic comparison
    const normalizedDate = typeof date === 'string' ? date : getDateStringFromObj(date);

    if (normalizedDate > classObj.activeTill || normalizedDate < classObj.activeFrom) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Date is not in bounds of active from and active till of class");
    }

    const isAlreadyCancelled = await CancelledClass.findOne({
        where: {
            classId: classId,
            date: normalizedDate
        }
    })

    if (isAlreadyCancelled) {
        throw new ApiError(httpStatus.CONFLICT, "Class is already cancelled")
    }

    await CancelledClass.create(
        {
            classId: classId,
            date: normalizedDate,
            reason: reason || null
        }
    );

    // sending notification to the students
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
            `Lecture of ${course.name} from ${classObj.startTime} to ${classObj.endTime} on ${fromYYYYMMDDToDDMMYYYY(normalizedDate)} is cancelled`,
            {
                type: "LectureCancelled",
                classId: classObj.id,
                cancelDate: fromYYYYMMDDToDDMMYYYY(normalizedDate)
            }
        )
    })

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Class marked as cancelled successfully", null));
});

const getCancelledClasses = asyncHandler(async (req, res) => {
    const {
        divisionId,
        batchId,
        date,
        page = 1,
        limit = 10,
        getAll = false,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Input validation for date is handled by @class.validation.js

    let timetableOfDivision = null
    if (divisionId) {
        timetableOfDivision = await Timetable.findOne({
            where: {
                divisionId: divisionId
            }
        })
        if (!timetableOfDivision) {
            throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found")
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
        ...(limit && getAll === false ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit: parseInt(limit, 10) } : {})
    })

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Cancelled classes retrieved successfully.", {
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