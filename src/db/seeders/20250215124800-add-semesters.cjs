'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Fetch necessary foreign keys for Branches and Schemes
        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const schemes = await queryInterface.sequelize.query(
            `SELECT scheme_id, scheme_name FROM schemes;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const compBranchId = branches.find(b => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find(b => b.branch_name === 'Civil Engineering')?.branch_id;
        const rev2019SchemeId = schemes.find(s => s.scheme_name === 'REV-2019 ‘C’ Scheme')?.scheme_id;
        const nep2020SchemeId = schemes.find(s => s.scheme_name === 'NEP-2020 Scheme')?.scheme_id;

        if (!compBranchId || !civilBranchId || !rev2019SchemeId || !nep2020SchemeId) {
            throw new Error('Required branches or schemes not found.');
        }

        // 2. Prepare and insert Semester data
        const semestersToInsert = [
            // FE Comp & Civil (NEP 2020)
            { id: uuidv4(), branch_id: compBranchId, semester_number: 1, scheme_id: nep2020SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2024-07-08', end_date: '2024-12-31' },
            { id: uuidv4(), branch_id: compBranchId, semester_number: 2, scheme_id: nep2020SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2025-01-08', end_date: '2025-06-30' },
            { id: uuidv4(), branch_id: civilBranchId, semester_number: 1, scheme_id: nep2020SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2024-07-08', end_date: '2024-12-31' },
            { id: uuidv4(), branch_id: civilBranchId, semester_number: 2, scheme_id: nep2020SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2025-01-08', end_date: '2025-06-30' },
            // SE, TE, BE Comp (REV 2019)
            { id: uuidv4(), branch_id: compBranchId, semester_number: 3, scheme_id: rev2019SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2024-07-08', end_date: '2024-12-31' },
            { id: uuidv4(), branch_id: compBranchId, semester_number: 4, scheme_id: rev2019SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2025-01-08', end_date: '2025-06-30' },
            { id: uuidv4(), branch_id: compBranchId, semester_number: 5, scheme_id: rev2019SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2024-07-08', end_date: '2024-12-31' },
            { id: uuidv4(), branch_id: compBranchId, semester_number: 6, scheme_id: rev2019SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2025-01-08', end_date: '2025-06-30' },
            { id: uuidv4(), branch_id: compBranchId, semester_number: 7, scheme_id: rev2019SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2024-07-08', end_date: '2024-12-31' },
            { id: uuidv4(), branch_id: compBranchId, semester_number: 8, scheme_id: rev2019SchemeId, academic_start_year: 2024, academic_end_year: 2025, start_date: '2025-01-08', end_date: '2025-06-30' },
        ].map(s => ({ ...s, created_at: new Date(), updated_at: new Date() }));

        await queryInterface.bulkInsert('semesters', semestersToInsert.map(({ id, ...rest }) => ({ semester_id: id, ...rest })));

        // 3. Fetch Courses to link to semesters
        const courses = await queryInterface.sequelize.query(
            `SELECT course_id, course_code FROM courses;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const courseIdMap = courses.reduce((map, course) => {
            map[course.course_code] = course.course_id;
            return map;
        }, {});

        // 4. Prepare and insert semester_courses data
        const semesterCoursesToInsert = [];
        const findSemesterId = (branchId, semNum) => semestersToInsert.find(s => s.branch_id === branchId && s.semester_number === semNum).id;

        // Comp Sem 5
        const compSem5Id = findSemesterId(compBranchId, 5);
        if (compSem5Id) {
            semesterCoursesToInsert.push({ id: uuidv4(), semester_id: compSem5Id, course_id: courseIdMap['CSDLO5012'], created_at: new Date(), updated_at: new Date() });
        }
        // Comp Sem 6
        const compSem6Id = findSemesterId(compBranchId, 6);
        if (compSem6Id) {
            semesterCoursesToInsert.push({ id: uuidv4(), semester_id: compSem6Id, course_id: courseIdMap['CSDLO6011'], created_at: new Date(), updated_at: new Date() });
        }
        // Comp Sem 7
        const compSem7Id = findSemesterId(compBranchId, 7);
        if (compSem7Id) {
            ['CSDC7011', 'CSDL7011', 'CSDC7021'].forEach(code => {
                semesterCoursesToInsert.push({ id: uuidv4(), semester_id: compSem7Id, course_id: courseIdMap[code], created_at: new Date(), updated_at: new Date() });
            });
        }
        // Comp Sem 8
        const compSem8Id = findSemesterId(compBranchId, 8);
        if (compSem8Id) {
            ['CSDC8011', 'CSDL8011', 'CSDC8021'].forEach(code => {
                semesterCoursesToInsert.push({ id: uuidv4(), semester_id: compSem8Id, course_id: courseIdMap[code], created_at: new Date(), updated_at: new Date() });
            });
        }

        if (semesterCoursesToInsert.length > 0) {
            await queryInterface.bulkInsert('semester_courses', semesterCoursesToInsert.map(({ id, ...rest }) => ({ semester_courses_id: id, ...rest })));
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('semester_courses', null, {});
        await queryInterface.bulkDelete('semesters', null, {});
    }
};