'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // adding second semester computer students to division a and b
        const secondSemesterComp = await queryInterface.sequelize.query(`
            SELECT * FROM students_semesters 
            INNER JOIN students ON students_semesters.student_id = students.student_id
            INNER JOIN semesters ON students_semesters.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 2 AND semesters.branch_id = 1;
            `)

        const secondSemesterCompDivisions = await queryInterface.sequelize.query(`
            SELECT * FROM divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 2;
            `)

        const secondSemesterCompDivisionEntries = []

        for (let i = 0; i < 60; i++) {
            if (i < 30) {
                secondSemesterCompDivisionEntries.push(
                    {
                        student_id: secondSemesterComp[0][i].student_id,
                        division_id: secondSemesterCompDivisions[0][0].division_id,
                        start_date: '2025-01-08',
                    }
                )
            } else {
                secondSemesterCompDivisionEntries.push(
                    {
                        student_id: secondSemesterComp[0][i].student_id,
                        division_id: secondSemesterCompDivisions[0][1].division_id,
                        start_date: '2025-01-08',
                    }
                )
            }
        }

        // adding fourth semester computer students to division a and b
        const fourthSemesterComp = await queryInterface.sequelize.query(`
            SELECT * FROM students_semesters 
            INNER JOIN students ON students_semesters.student_id = students.student_id
            INNER JOIN semesters ON students_semesters.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 4 AND semesters.branch_id = 1;
            `)

        const fourthSemesterCompDivisions = await queryInterface.sequelize.query(`
            SELECT * FROM divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 4 AND semesters.branch_id = 1;
            `)

        const fourthSemesterCompDivisionEntries = []

        for (let i = 0; i < 60; i++) {
            if (i < 30) {
                fourthSemesterCompDivisionEntries.push(
                    {
                        student_id: fourthSemesterComp[0][i].student_id,
                        division_id: fourthSemesterCompDivisions[0][0].division_id,
                        start_date: '2025-01-08',
                    }
                )
            } else {
                fourthSemesterCompDivisionEntries.push(
                    {
                        student_id: fourthSemesterComp[0][i].student_id,
                        division_id: fourthSemesterCompDivisions[0][1].division_id,
                        start_date: '2025-01-08',
                    }
                )
            }
        }

        // adding sixth semester computer students to division a and b
        const sixthSemesterComp = await queryInterface.sequelize.query(`
            SELECT * FROM students_semesters 
            INNER JOIN students ON students_semesters.student_id = students.student_id
            INNER JOIN semesters ON students_semesters.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 6 AND semesters.branch_id = 1;
            `)
        const sixthSemesterCompDivisions = await queryInterface.sequelize.query(`
            SELECT * FROM divisions
            INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 6 AND semesters.branch_id = 1;
            `)

        const sixthSemesterCompDivisionEntries = []

        for (let i = 0; i < 60; i++) {
            if (i < 30) {
                sixthSemesterCompDivisionEntries.push(
                    {
                        student_id: sixthSemesterComp[0][i].student_id,
                        division_id: sixthSemesterCompDivisions[0][0].division_id,
                        start_date: '2025-01-08',
                    }
                )
            } else {
                sixthSemesterCompDivisionEntries.push(
                    {
                        student_id: sixthSemesterComp[0][i].student_id,
                        division_id: sixthSemesterCompDivisions[0][1].division_id,
                        start_date: '2025-01-08',
                    }
                )
            }
        }

        // adding eighth semester computer students to division a and b
        const eightSemesterComp = await queryInterface.sequelize.query(`
            SELECT * FROM students_semesters 
            INNER JOIN students ON students_semesters.student_id = students.student_id
            INNER JOIN semesters ON students_semesters.semester_id = semesters.semester_id
            WHERE semesters.semester_number = 8 AND semesters.branch_id = 1;
            `)
        const eightSemesterCompDivisions = await queryInterface.sequelize.query(`
                SELECT * FROM divisions
                INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
                WHERE semesters.semester_number = 8 AND semesters.branch_id = 1;
                `)

        const eightSemesterCompDivisionEntries = []

        for (let i = 0; i < 60; i++) {
            if (i < 30) {
                eightSemesterCompDivisionEntries.push(
                    {
                        student_id: eightSemesterComp[0][i].student_id,
                        division_id: eightSemesterCompDivisions[0][0].division_id,
                        start_date: '2025-01-08',
                    }
                )
            } else {
                eightSemesterCompDivisionEntries.push(
                    {
                        student_id: eightSemesterComp[0][i].student_id,
                        division_id: eightSemesterCompDivisions[0][1].division_id,
                        start_date: '2025-01-08',
                    }
                )
            }
        }

        // adding second semester civil students to division a and b
        const secondSemesterCivil = await queryInterface.sequelize.query(`
            SELECT * FROM students_semesters 
            INNER JOIN students ON students_semesters.student_id = students.student_id
            INNER JOIN semesters ON students_semesters.semester_id = semesters.semester_id              
            WHERE semesters.semester_number = 2 AND semesters.branch_id = 2;
            `)
        const secondSemesterCivilDivisions = await queryInterface.sequelize.query(`
                SELECT * FROM divisions
                INNER JOIN semesters ON divisions.semester_id = semesters.semester_id
                WHERE semesters.semester_number = 2 AND semesters.branch_id = 2;
                `)
        const secondSemesterCivilDivisionEntries = []
        for (let i = 0; i < 60; i++) {
            if (i < 30) {
                secondSemesterCivilDivisionEntries.push(
                    {
                        student_id: secondSemesterCivil[0][i].student_id,
                        division_id: secondSemesterCivilDivisions[0][0].division_id,
                        start_date: '2025-01-08',
                    }
                )
            } else {
                secondSemesterCivilDivisionEntries.push(
                    {
                        student_id: secondSemesterCivil[0][i].student_id,
                        division_id: secondSemesterCivilDivisions[0][1].division_id,
                        start_date: '2025-01-08',
                    }
                )
            }
        }

        await queryInterface.bulkInsert("students_divisions", [
            ...secondSemesterCompDivisionEntries,
            ...secondSemesterCivilDivisionEntries,
            ...fourthSemesterCompDivisionEntries,
            ...sixthSemesterCompDivisionEntries,
            ...eightSemesterCompDivisionEntries,
        ], {})

    },

    async down(queryInterface, Sequelize) {

    }
};
