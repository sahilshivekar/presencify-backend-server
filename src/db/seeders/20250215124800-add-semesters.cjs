'use strict';

// const Semester = require('../models/semester.model');
// const Course = require('../models/course.model');


/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.sequelize.query(`
            -- sem 1 & 2 all branch have same nep 2020 scheme
            INSERT INTO Semesters (branch_id, semester_number, scheme_id, academic_start_year, academic_end_year) VALUES
            (1, 1, 2, 2024, 2025), -- fe comp with scheme nep 2020
            (1, 2, 2, 2024, 2025),
            
            (2, 1, 2, 2024, 2025), -- fe civil with scheme nep 2020
            (2, 2, 2, 2024, 2025),
            
            (1, 3, 1, 2024, 2025), -- se comp with scheme rev 2019
            (1, 4, 1, 2024, 2025),
            
            (1, 5, 1, 2024, 2025), -- te comp with scheme rev 2019
            (1, 6, 1, 2024, 2025),
            
            (1, 7, 1, 2024, 2025), -- be comp with scheme rev 2019
            (1, 8, 1, 2024, 2025);
        `)


        // adding default optional courses for each semester that have optional subject
        const fifthSemesterComp = await queryInterface.sequelize.query(`
                SELECT * FROM semesters WHERE semester_number = 5 AND branch_id = 1
                `)
        const fiftSemesterCompDefaultCourse = await queryInterface.sequelize.query(`
                SELECT * FROM courses WHERE course_code IN ('CSDLO5012')
                `)
        await queryInterface.bulkInsert('semester_courses', [
            {
                semester_id: fifthSemesterComp[0][0].semester_id,
                course_id: fiftSemesterCompDefaultCourse[0][0].course_id,
            },
        ],)

        const sixthSemesterComp = await queryInterface.sequelize.query(`
                SELECT * FROM semesters WHERE semester_number = 6 AND branch_id = 1
                `)
        const sixthSemesterCompDefaultCourse = await queryInterface.sequelize.query(`
                SELECT * FROM courses WHERE course_code IN ('CSDLO6011')
                `)
        await queryInterface.bulkInsert('semester_courses', [
            {
                semester_id: sixthSemesterComp[0][0].semester_id,
                course_id: sixthSemesterCompDefaultCourse[0][0].course_id
            }
        ],)


        const seventhSemesterComp = await queryInterface.sequelize.query(`
                SELECT * FROM semesters WHERE semester_number = 7 AND branch_id = 1
                `)
        const seventhSemesterCompDefaultCourse = await queryInterface.sequelize.query(`
                SELECT * FROM courses WHERE course_code IN ('CSDC7011', 'CSDL7011', 'CSDC7021', 'CSDL7021')
                `)
        await queryInterface.bulkInsert('semester_courses', [
            {
                semester_id: seventhSemesterComp[0][0].semester_id,
                course_id: seventhSemesterCompDefaultCourse[0][0].course_id,
            },
            {
                semester_id: seventhSemesterComp[0][0].semester_id,
                course_id: seventhSemesterCompDefaultCourse[0][1].course_id,
            },
            {
                semester_id: seventhSemesterComp[0][0].semester_id,
                course_id: seventhSemesterCompDefaultCourse[0][2].course_id,
            },
        ])


        const eighthSemesterComp = await queryInterface.sequelize.query(`
                SELECT * FROM semesters WHERE semester_number = 8 AND branch_id = 1
                `)
        const eighthSemesterCompDefaultCourse = await queryInterface.sequelize.query(`
                SELECT * FROM courses WHERE course_code IN ('CSDC8011', 'CSDL8011', 'CSDC8021', 'CSDL8021')
                `)
        await queryInterface.bulkInsert('semester_courses', [
            {
                semester_id: eighthSemesterComp[0][0].semester_id,
                course_id: eighthSemesterCompDefaultCourse[0][0].course_id,
            },
            {
                semester_id: eighthSemesterComp[0][0].semester_id,
                course_id: eighthSemesterCompDefaultCourse[0][1].course_id,
            },
            {
                semester_id: eighthSemesterComp[0][0].semester_id,
                course_id: eighthSemesterCompDefaultCourse[0][2].course_id,
            },
        ])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from semesters`)
        await queryInterface.sequelize.query(`delete from semester_courses`)
    }
};
