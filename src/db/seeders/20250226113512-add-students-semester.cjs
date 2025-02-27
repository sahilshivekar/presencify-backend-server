'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches WHERE branch_name IN ('Computer Engineering', 'Civil Engineering');`
        );

        const compBranchId = branches[0].find(b => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches[0].find(b => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error("Comp or Civil branch ID not found!");
        }

        const students = await queryInterface.sequelize.query(
            `SELECT student_id, first_name, last_name, admission_year FROM students;`
        );

        const semesters = await queryInterface.sequelize.query(
            `SELECT * FROM semesters`
        )

        // also admission year matters
        const getSemester = (firstName, lastName, admissionYear) => {
            // first year computer
            if (firstName[0] == 'F' && lastName[1] == 'o' && admissionYear == 2024) {
                return semesters[0].find(semester => semester.semester_number == 2 && semester.branch_id == compBranchId)
            }

            //second year computer
            else if (firstName[0] == 'S' && lastName[1] == 'o' && admissionYear == 2023) {
                return semesters[0].find(semester => semester.semester_number == 4 && semester.branch_id == compBranchId)
            }

            //third year computer
            else if (firstName[0] == 'T' && lastName[1] == 'o' && admissionYear == 2022) {
                return semesters[0].find(semester => semester.semester_number == 6 && semester.branch_id == compBranchId)
            }

            //fourth year computer
            else if (firstName[0] == 'B' && lastName[1] == 'o' && admissionYear == 2021) {
                return semesters[0].find(semester => semester.semester_number == 8 && semester.branch_id == compBranchId)
            }

            // first year civil
            else if (firstName[0] == 'F' && lastName[1] == 'i' && admissionYear == 2024) {
                return semesters[0].find(semester => semester.semester_number == 2 && semester.branch_id == civilBranchId)
            }
        }

        const studentSemesters = students[0].map(student => ({
            student_id: student.student_id,
            semester_id: getSemester(student.first_name, student.last_name, student.admission_year).semester_id,
            created_at: new Date(),
            updated_at: new Date(),
        }));

        await queryInterface.bulkInsert('students_semesters', studentSemesters, {});
    },


    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students_semesters', null, {});
    }
};
