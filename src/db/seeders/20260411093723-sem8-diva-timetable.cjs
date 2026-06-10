'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ── 1. Resolve branch / semester ──────────────────────────────────────
        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const compBranchId = branches.find(b => b.branch_name === 'Computer Engineering')?.branch_id;
        if (!compBranchId) throw new Error('Computer Engineering branch not found.');

        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, semester_number, branch_id, start_date, end_date
             FROM semesters
             WHERE branch_id = '${compBranchId}' AND semester_number = 8
               AND academic_start_year = 2025 AND academic_end_year = 2026;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const semester8 = semesters[0];
        if (!semester8) throw new Error('Semester 8 (Comp, 2025-26) not found.');

        const activeFrom = semester8.start_date; // YYYY-MM-DD
        const activeTill = semester8.end_date;   // YYYY-MM-DD

        // ── 2. Resolve Division A of Semester 8 ──────────────────────────────
        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id, division_code FROM divisions WHERE semester_id = '${semester8.semester_id}';`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const divisionA = divisions.find(d => d.division_code === 'A');
        if (!divisionA) throw new Error('Division A of Semester 8 not found.');

        // ── 3. Resolve batches BA1 & BA2 ─────────────────────────────────────
        const batches = await queryInterface.sequelize.query(
            `SELECT batch_id, batch_code FROM batches WHERE division_id = '${divisionA.division_id}';`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const ba1 = batches.find(b => b.batch_code === 'BA1');
        const ba2 = batches.find(b => b.batch_code === 'BA2');
        if (!ba1 || !ba2) throw new Error('Batches BA1 / BA2 not found for Division A.');

        // ── 4. Resolve courses by name ────────────────────────────────────────
        const courseNames = [
            'Digital Forensic', 'Social Media Analytics',
            'Environmental Management', 'Distributed Computing',
            'Digital Forensic Lab', 'Social Media Analytics Lab',
            'Distributed Computing Lab'
        ];
        const coursesRaw = await queryInterface.sequelize.query(
            `SELECT course_id, course_name FROM courses WHERE course_name IN (${courseNames.map(n => `'${n}'`).join(', ')});`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const courseMap = {};
        coursesRaw.forEach(c => { courseMap[c.course_name] = c.course_id; });
        const missingCourses = courseNames.filter(n => !courseMap[n]);
        if (missingCourses.length > 0) throw new Error(`Courses not found: ${missingCourses.join(', ')}`);

        // ── 5. Resolve specific teachers for each course ──────────────────────
        const teacherRows = await queryInterface.sequelize.query(
            `SELECT teacher_id, first_name, last_name FROM teacher
             WHERE (first_name = 'Nilesh'        AND last_name = 'Meheta')
                OR (first_name = 'Varsha'        AND last_name = 'Jogalekar')
                OR (first_name = 'Renuka'        AND last_name = 'Sanga')
                OR (first_name = 'Sandeep'       AND last_name = 'More');`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const teacherByName = (firstName, lastName) => {
            const teacher = teacherRows.find(
                t => t.first_name === firstName && t.last_name === lastName
            );
            if (!teacher) {
                throw new Error(`Teacher not found: ${firstName} ${lastName}`);
            }
            return teacher.teacher_id;
        };

        const teacherMap = {
            'Digital Forensic': teacherByName('Nilesh', 'Meheta'),
            'Digital Forensic Lab': teacherByName('Nilesh', 'Meheta'),
            'Environmental Management': teacherByName('Varsha', 'Jogalekar'),
            'Social Media Analytics': teacherByName('Renuka', 'Sanga'),
            'Social Media Analytics Lab': teacherByName('Renuka', 'Sanga'),
            'Distributed Computing': teacherByName('Sandeep', 'More'),
            'Distributed Computing Lab': teacherByName('Sandeep', 'More')
        };

        // ── 5a. Register teacher–course assignments in teacher_teaches_course ─
        // Required by addClass controller: teacher must have the course assigned.
        // Only insert pairs that don't already exist (avoid unique constraint errors).
        const existingAssignments = await queryInterface.sequelize.query(
            `SELECT teacher_id, course_id FROM teacher_teaches_course;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const assignmentSet = new Set(
            existingAssignments.map(r => `${r.teacher_id}__${r.course_id}`)
        );

        const newAssignments = courseNames
            .map(name => ({
                teacher_course_id: uuidv4(),
                teacher_id: teacherMap[name],
                course_id: courseMap[name],
                created_at: new Date(),
                updated_at: new Date()
            }))
            .filter(r => !assignmentSet.has(`${r.teacher_id}__${r.course_id}`));

        if (newAssignments.length > 0) {
            await queryInterface.bulkInsert('teacher_teaches_course', newAssignments);
        }

        // ── 6. Resolve rooms ──────────────────────────────────────────────────
        const classroomsRaw = await queryInterface.sequelize.query(
            `SELECT room_id FROM rooms WHERE room_type = 'Classroom' AND room_number = '402' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const labRoomsRaw = await queryInterface.sequelize.query(
            `SELECT room_id, room_number FROM rooms 
             WHERE room_type = 'Lab' AND room_number IN ('201', '108', '501');`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        if (classroomsRaw.length === 0) throw new Error('No Classroom room with number 402 found.');
        if (labRoomsRaw.length < 3) throw new Error('Not enough Lab rooms found (need 201, 108, 501).');

        const lectureRoomId = classroomsRaw[0].room_id;

        const getLabRoomId = (roomNumber) => {
            const room = labRoomsRaw.find(r => r.room_number === roomNumber);
            if (!room) {
                throw new Error(`Lab room with number ${roomNumber} not found.`);
            }
            return room.room_id;
        };

        const labRoomMap = {
            'Distributed Computing Lab': getLabRoomId('201'),
            'Digital Forensic Lab': getLabRoomId('108'),
            'Social Media Analytics Lab': getLabRoomId('501')
        };

        // ── 7. Ensure a timetable exists for Division A ───────────────────────
        const existingTimetables = await queryInterface.sequelize.query(
            `SELECT timetable_id FROM timetables WHERE division_id = '${divisionA.division_id}';`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        let timetableId;
        if (existingTimetables.length > 0) {
            timetableId = existingTimetables[0].timetable_id;
        } else {
            timetableId = uuidv4();
            await queryInterface.bulkInsert('timetables', [{
                timetable_id: timetableId,
                division_id: divisionA.division_id,
                timetable_version: 1,
                created_at: new Date(),
                updated_at: new Date()
            }]);
        }

        // ── 8. Build class records ────────────────────────────────────────────
        const classes = [];

        // Lecture schedule: same course at same slot every day Mon-Sat
        const lectures = [
            // MONDAY
            { day: "Monday", courseName: "Environmental Management", start: "10:00:00", end: "11:00:00" },
            { day: "Monday", courseName: "Social Media Analytics", start: "11:00:00", end: "12:00:00" },
            { day: "Monday", courseName: "Distributed Computing", start: "14:45:00", end: "15:45:00" },

            // TUESDAY
            { day: "Tuesday", courseName: "Distributed Computing", start: "12:30:00", end: "13:30:00" },
            { day: "Tuesday", courseName: "Digital Forensic", start: "13:30:00", end: "14:30:00" },

            // WEDNESDAY
            // (only labs, no lecture)

            // THURSDAY
            { day: "Thursday", courseName: "Digital Forensic", start: "10:00:00", end: "11:00:00" },
            { day: "Thursday", courseName: "Environmental Management", start: "11:00:00", end: "12:00:00" },
            { day: "Thursday", courseName: "Social Media Analytics", start: "12:30:00", end: "13:30:00" },

            // FRIDAY
            { day: "Friday", courseName: "Digital Forensic", start: "10:00:00", end: "11:00:00" },
            { day: "Friday", courseName: "Distributed Computing", start: "11:00:00", end: "12:00:00" },
            { day: "Friday", courseName: "Environmental Management", start: "12:30:00", end: "13:30:00" },
            { day: "Friday", courseName: "Social Media Analytics", start: "13:30:00", end: "14:30:00" },
        ];

        const labs = [
            // MONDAY LAB
            {
                day: "Monday",
                courseName: "Distributed Computing Lab",
                batch: ba1.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },
            {
                day: "Monday",
                courseName: "Digital Forensic Lab",
                batch: ba2.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },

            // TUESDAY LAB
            {
                day: "Tuesday",
                courseName: "Social Media Analytics Lab",
                batch: ba1.batch_id,
                start: "10:00:00",
                end: "12:00:00"
            },

            // WEDNESDAY LABS
            {
                day: "Wednesday",
                courseName: "Social Media Analytics Lab",
                batch: ba2.batch_id,
                start: "10:00:00",
                end: "12:00:00"
            },
            {
                day: "Wednesday",
                courseName: "Distributed Computing Lab",
                batch: ba2.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },
            {
                day: "Wednesday",
                courseName: "Digital Forensic Lab",
                batch: ba1.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            }
        ];

        for (const lecture of lectures) {
            classes.push({
                class_id: uuidv4(),
                teacher_id: teacherMap[lecture.courseName],
                course_id: courseMap[lecture.courseName],
                room_id: lectureRoomId,
                timetable_id: timetableId,
                batch_id: null,
                day_of_week: lecture.day,
                start_time: lecture.start,
                end_time: lecture.end,
                is_extra_class: false,
                active_from: activeFrom,
                active_till: activeTill,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        for (const lab of labs) {
            classes.push({
                class_id: uuidv4(),
                teacher_id: teacherMap[lab.courseName],
                course_id: courseMap[lab.courseName],
                room_id: labRoomMap[lab.courseName],
                timetable_id: timetableId,
                batch_id: lab.batch,
                day_of_week: lab.day,
                start_time: lab.start,
                end_time: lab.end,
                is_extra_class: false,
                active_from: activeFrom,
                active_till: activeTill,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        await queryInterface.bulkInsert('classes', classes, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('classes', null, {});
        await queryInterface.bulkDelete('timetables', null, {});
        await queryInterface.bulkDelete('teacher_teaches_course', null, {});
    }
};