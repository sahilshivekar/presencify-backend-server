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

        // ── 2. Resolve Division B of Semester 8 ──────────────────────────────
        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id, division_code FROM divisions WHERE semester_id = '${semester8.semester_id}';`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const divisionB = divisions.find(d => d.division_code === 'B');
        if (!divisionB) throw new Error('Division B of Semester 8 not found.');

        // ── 3. Resolve batches BB1 & BB2 ─────────────────────────────────────
        const batches = await queryInterface.sequelize.query(
            `SELECT batch_id, batch_code FROM batches WHERE division_id = '${divisionB.division_id}';`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const bb1 = batches.find(b => b.batch_code === 'BB1');
        const bb2 = batches.find(b => b.batch_code === 'BB2');
        if (!bb1 || !bb2) throw new Error('Batches BB1 / BB2 not found for Division B.');

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

        // ── 5. Assign one random teacher per course ───────────────────────────
        const teachers = await queryInterface.sequelize.query(
            `SELECT teacher_id FROM teacher ORDER BY RANDOM() LIMIT ${courseNames.length};`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        if (teachers.length < courseNames.length) throw new Error('Not enough teachers in the database.');
        const teacherMap = {};
        courseNames.forEach((name, idx) => { teacherMap[name] = teachers[idx].teacher_id; });

        // ── 6. Resolve rooms ──────────────────────────────────────────────────
        const classroomsRaw = await queryInterface.sequelize.query(
            `SELECT room_id FROM rooms WHERE room_type = 'Classroom' LIMIT 1;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const labRoomsRaw = await queryInterface.sequelize.query(
            `SELECT room_id FROM rooms WHERE room_type = 'Lab' LIMIT 3;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        if (classroomsRaw.length === 0) throw new Error('No Classroom room found.');
        if (labRoomsRaw.length < 3) throw new Error('Not enough Lab rooms found (need 3).');

        const lectureRoomId = classroomsRaw[0].room_id;
        const labRoomMap = {
            'Digital Forensic Lab':       labRoomsRaw[0].room_id,
            'Social Media Analytics Lab': labRoomsRaw[1].room_id,
            'Distributed Computing Lab':  labRoomsRaw[2].room_id
        };

        // ── 7. Ensure a timetable exists for Division B ───────────────────────
        const existingTimetables = await queryInterface.sequelize.query(
            `SELECT timetable_id FROM timetables WHERE division_id = '${divisionB.division_id}';`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        let timetableId;
        if (existingTimetables.length > 0) {
            timetableId = existingTimetables[0].timetable_id;
        } else {
            timetableId = uuidv4();
            await queryInterface.bulkInsert('timetables', [{
                timetable_id: timetableId,
                division_id: divisionB.division_id,
                timetable_version: 1,
                created_at: new Date(),
                updated_at: new Date()
            }]);
        }

        // ── 8. Build class records ────────────────────────────────────────────
        const classes = [];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Lecture schedule: same course at same slot every day Mon-Sat
        const lectureSlots = [
            { courseName: 'Digital Forensic',         start: '10:00:00', end: '11:00:00' },
            { courseName: 'Social Media Analytics',   start: '11:00:00', end: '12:00:00' },
            { courseName: 'Environmental Management', start: '12:30:00', end: '13:30:00' },
            { courseName: 'Distributed Computing',    start: '13:30:00', end: '14:30:00' }
        ];

        for (const day of days) {
            for (const slot of lectureSlots) {
                classes.push({
                    class_id: uuidv4(),
                    teacher_id: teacherMap[slot.courseName],
                    course_id: courseMap[slot.courseName],
                    room_id: lectureRoomId,
                    timetable_id: timetableId,
                    batch_id: null,
                    day_of_week: day,
                    start_time: slot.start,
                    end_time: slot.end,
                    class_type: 'Lecture',
                    is_extra_class: false,
                    active_from: activeFrom,
                    active_till: activeTill,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
        }

        // Lab schedule: 2:45-4:45, both batches in parallel, each lab 2x/week per batch
        // Mon & Thu: BB1=Digital Forensic Lab,       BB2=Social Media Analytics Lab
        // Tue & Fri: BB1=Social Media Analytics Lab, BB2=Digital Forensic Lab
        // Wed & Sat: BB1=Distributed Computing Lab,  BB2=Distributed Computing Lab
        const labSchedule = [
            { day: 'Monday',    bb1: 'Digital Forensic Lab',       bb2: 'Social Media Analytics Lab' },
            { day: 'Tuesday',   bb1: 'Social Media Analytics Lab', bb2: 'Digital Forensic Lab'       },
            { day: 'Wednesday', bb1: 'Distributed Computing Lab',  bb2: 'Distributed Computing Lab'  },
            { day: 'Thursday',  bb1: 'Digital Forensic Lab',       bb2: 'Social Media Analytics Lab' },
            { day: 'Friday',    bb1: 'Social Media Analytics Lab', bb2: 'Digital Forensic Lab'       },
            { day: 'Saturday',  bb1: 'Distributed Computing Lab',  bb2: 'Distributed Computing Lab'  }
        ];

        for (const entry of labSchedule) {
            // BB1 lab
            classes.push({
                class_id: uuidv4(),
                teacher_id: teacherMap[entry.bb1],
                course_id: courseMap[entry.bb1],
                room_id: labRoomMap[entry.bb1],
                timetable_id: timetableId,
                batch_id: bb1.batch_id,
                day_of_week: entry.day,
                start_time: '14:45:00',
                end_time: '16:45:00',
                class_type: 'Practical',
                is_extra_class: false,
                active_from: activeFrom,
                active_till: activeTill,
                created_at: new Date(),
                updated_at: new Date()
            });
            // BB2 lab
            classes.push({
                class_id: uuidv4(),
                teacher_id: teacherMap[entry.bb2],
                course_id: courseMap[entry.bb2],
                room_id: labRoomMap[entry.bb2],
                timetable_id: timetableId,
                batch_id: bb2.batch_id,
                day_of_week: entry.day,
                start_time: '14:45:00',
                end_time: '16:45:00',
                class_type: 'Practical',
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
    }
};