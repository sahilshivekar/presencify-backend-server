'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Fetch existing data for foreign keys
        const teachers = await queryInterface.sequelize.query(
            `SELECT teacher_id FROM teacher LIMIT 10;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const rooms = await queryInterface.sequelize.query(
            `SELECT room_id FROM rooms LIMIT 10;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const courses = await queryInterface.sequelize.query(
            `SELECT course_id FROM courses LIMIT 10;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const timetables = await queryInterface.sequelize.query(
            `SELECT timetable_id, division_id FROM timetables;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        // If no timetables exist, create them for divisions
        if (timetables.length === 0) {
            const divisions = await queryInterface.sequelize.query(
                `SELECT division_id FROM divisions;`,
                { type: queryInterface.sequelize.QueryTypes.SELECT }
            );

            if (divisions.length > 0) {
                const newTimetables = divisions.map(division => ({
                    timetable_id: uuidv4(),
                    division_id: division.division_id,
                    timetable_version: 1,
                    created_at: new Date(),
                    updated_at: new Date()
                }));

                await queryInterface.bulkInsert('timetables', newTimetables, {});

                // Re-fetch timetables after creation
                const updatedTimetables = await queryInterface.sequelize.query(
                    `SELECT timetable_id FROM timetables;`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );
                timetables.push(...updatedTimetables);
            }
        }

        const batches = await queryInterface.sequelize.query(
            `SELECT batch_id FROM batches LIMIT 10;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (teachers.length === 0 || rooms.length === 0 || courses.length === 0 || timetables.length === 0) {
            throw new Error('Required data not found. Please ensure teachers, rooms, courses, and timetables are seeded first.');
        }

        // Helper function to get random item from array
        const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

        // Define class time slots
        const timeSlots = [
            { start: '09:00:00', end: '10:00:00' },
            { start: '10:00:00', end: '11:00:00' },
            { start: '11:00:00', end: '12:00:00' },
            { start: '13:00:00', end: '14:00:00' },
            { start: '14:00:00', end: '15:00:00' },
            { start: '15:00:00', end: '16:00:00' },
            { start: '16:00:00', end: '17:00:00' }
        ];

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const classTypes = ['Lecture', 'Tutorial', 'Practical'];

        // Create 5 random classes
        const classes = [];
        for (let i = 0; i < 5; i++) {
            const timeSlot = getRandomItem(timeSlots);
            const currentDate = new Date();
            const activeFrom = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const activeTill = new Date(currentDate.getFullYear() + 1, 11, 31); // End of next year
            
            const classData = {
                class_id: uuidv4(),
                teacher_id: getRandomItem(teachers).teacher_id,
                start_time: timeSlot.start,
                end_time: timeSlot.end,
                day_of_week: getRandomItem(daysOfWeek),
                room_id: getRandomItem(rooms).room_id,
                batch_id: Math.random() > 0.5 ? getRandomItem(batches).batch_id : null, // 50% chance of having a batch
                active_from: activeFrom.toISOString().split('T')[0], // YYYY-MM-DD format
                active_till: activeTill.toISOString().split('T')[0], // YYYY-MM-DD format
                class_type: getRandomItem(classTypes),
                course_id: getRandomItem(courses).course_id,
                timetable_id: getRandomItem(timetables).timetable_id,
                is_extra_class: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            classes.push(classData);
        }

        await queryInterface.bulkInsert('classes', classes, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('classes', null, {});
    }
};