'use strict';

const { query } = require('express');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {


        const studentsDivisions = await queryInterface.sequelize.query(`
            SELECT student_id, division_id FROM students_divisions;
        `);

        const aDivisionCompBatchesSem2 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 1 AND divisions.division_code = 'A';
        `);

        const bDivisionCompBatchesSem2 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 1 AND divisions.division_code = 'B';
        `);

        const aDivisionCompBatchesSem4 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 4 AND semesters.branch_id = 1 AND divisions.division_code = 'A';
        `);

        const bDivisionCompBatchesSem4 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 4 AND semesters.branch_id = 1 AND divisions.division_code = 'B';
        `);

        const aDivisionCompBatchesSem6 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 6 AND semesters.branch_id = 1 AND divisions.division_code = 'A';
        `);

        const bDivisionCompBatchesSem6 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 6 AND semesters.branch_id = 1 AND divisions.division_code = 'B';
        `);

        const aDivisionCompBatchesSem8 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 8 AND semesters.branch_id = 1 AND divisions.division_code = 'A';
        `);

        const bDivisionCompBatchesSem8 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 8 AND semesters.branch_id = 1 AND divisions.division_code = 'B';
        `);

        const aDivisionCivBatchesSem2 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 2 AND divisions.division_code = 'A';
        `);

        const bDivisionCivBatchesSem2 = await queryInterface.sequelize.query(`
            SELECT batch_id, divisions.division_id FROM batches
            INNER JOIN divisions ON divisions.division_id = batches.division_id
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            where semesters.semester_number = 2 AND semesters.branch_id = 2 AND divisions.division_code = 'B';
        `);

        const studentDivisionACompSem2 = []
        const studentDivisionBCompSem2 = []
        const studentDivisionACompSem4 = []
        const studentDivisionBCompSem4 = []
        const studentDivisionACompSem6 = []
        const studentDivisionBCompSem6 = []
        const studentDivisionACompSem8 = []
        const studentDivisionBCompSem8 = []
        const studentDivisionACivSem2 = []
        const studentDivisionBCivSem2 = []

        studentsDivisions[0].forEach(studentDivision => {

            if (studentDivision.division_id === aDivisionCompBatchesSem2[0][0].division_id /* division id for both batches is same hence only accessing first */) {
                studentDivisionACompSem2.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === bDivisionCompBatchesSem2[0][0].division_id) {
                studentDivisionBCompSem2.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === aDivisionCompBatchesSem4[0][0].division_id) {
                studentDivisionACompSem4.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === bDivisionCompBatchesSem4[0][0].division_id) {
                studentDivisionBCompSem4.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === aDivisionCompBatchesSem6[0][0].division_id) {
                studentDivisionACompSem6.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === bDivisionCompBatchesSem6[0][0].division_id) {
                studentDivisionBCompSem6.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === aDivisionCompBatchesSem8[0][0].division_id) {
                studentDivisionACompSem8.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === bDivisionCompBatchesSem8[0][0].division_id) {
                studentDivisionBCompSem8.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === aDivisionCivBatchesSem2[0][0].division_id) {
                studentDivisionACivSem2.push(studentDivision.student_id)
            }
            else if (studentDivision.division_id === bDivisionCivBatchesSem2[0][0].division_id) {
                studentDivisionBCivSem2.push(studentDivision.student_id)
            }

        })

        const studentDivisionACompSem2BatchWiseEntries = []
        const studentDivisionBCompSem2BatchWiseEntries = []
        const studentDivisionACompSem4BatchWiseEntries = []
        const studentDivisionBCompSem4BatchWiseEntries = []
        const studentDivisionACompSem6BatchWiseEntries = []
        const studentDivisionBCompSem6BatchWiseEntries = []
        const studentDivisionACompSem8BatchWiseEntries = []
        const studentDivisionBCompSem8BatchWiseEntries = []
        const studentDivisionACivSem2BatchWiseEntries = []
        const studentDivisionBCivSem2BatchWiseEntries = []

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionACompSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem2[i],
                        batch_id: aDivisionCompBatchesSem2[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionACompSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem2[i],
                        batch_id: aDivisionCompBatchesSem2[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionBCompSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem2[i],
                        batch_id: bDivisionCompBatchesSem2[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionBCompSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem2[i],
                        batch_id: bDivisionCompBatchesSem2[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionACompSem4BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem4[i],
                        batch_id: aDivisionCompBatchesSem4[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionACompSem4BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem4[i],
                        batch_id: aDivisionCompBatchesSem4[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionBCompSem4BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem4[i],
                        batch_id: bDivisionCompBatchesSem4[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionBCompSem4BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem4[i],
                        batch_id: bDivisionCompBatchesSem4[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionACompSem6BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem6[i],
                        batch_id: aDivisionCompBatchesSem6[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionACompSem6BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem6[i],
                        batch_id: aDivisionCompBatchesSem6[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionBCompSem6BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem6[i],
                        batch_id: bDivisionCompBatchesSem6[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionBCompSem6BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem6[i],
                        batch_id: bDivisionCompBatchesSem6[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionACompSem8BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem8[i],
                        batch_id: aDivisionCompBatchesSem8[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionACompSem8BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACompSem8[i],
                        batch_id: aDivisionCompBatchesSem8[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionBCompSem8BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem8[i],
                        batch_id: bDivisionCompBatchesSem8[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionBCompSem8BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCompSem8[i],
                        batch_id: bDivisionCompBatchesSem8[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionACivSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACivSem2[i],
                        batch_id: aDivisionCivBatchesSem2[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionACivSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionACivSem2[i],
                        batch_id: aDivisionCivBatchesSem2[0][1].batch_id,
                    }
                )
            }
        }

        for (let i = 0; i < 30; i++) {
            if (i < 15) {
                studentDivisionBCivSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCivSem2[i],
                        batch_id: bDivisionCivBatchesSem2[0][0].batch_id,
                    }
                )
            }
            else {
                studentDivisionBCivSem2BatchWiseEntries.push(
                    {
                        student_id: studentDivisionBCivSem2[i],
                        batch_id: bDivisionCivBatchesSem2[0][1].batch_id,
                    }
                )
            }
        }

        await queryInterface.bulkInsert('students_batches', [
            ...studentDivisionACompSem2BatchWiseEntries,
            ...studentDivisionBCompSem2BatchWiseEntries,
            ...studentDivisionACompSem4BatchWiseEntries,
            ...studentDivisionBCompSem4BatchWiseEntries,
            ...studentDivisionACompSem6BatchWiseEntries,
            ...studentDivisionBCompSem6BatchWiseEntries,
            ...studentDivisionACompSem8BatchWiseEntries,
            ...studentDivisionBCompSem8BatchWiseEntries,
            ...studentDivisionACivSem2BatchWiseEntries,
            ...studentDivisionBCivSem2BatchWiseEntries
        ], {})

    },
    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from students_batches`)
    }
};
