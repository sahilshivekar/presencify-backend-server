'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const students = await queryInterface.sequelize.query(
            `SELECT student_id, first_name, last_name, admission_year, admission_type FROM students;`
        );

        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches WHERE branch_name IN ('Computer Engineering', 'Civil Engineering');`
        );

        const compBranchId = branches[0].find(b => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches[0].find(b => b.branch_name === 'Civil Engineering')?.branch_id;
        
        // console.log(compBranchId, civilBranchId);
        if (!compBranchId || !civilBranchId) {
            throw new Error("Comp or Civil branch ID not found!");
        }

        const studentBranches = students[0].map(student => ({
            student_id: student.student_id,
            branch_id: student.last_name[1] == 'o' ? compBranchId : civilBranchId,
            academic_start_year: student.admission_year,
            academic_end_year: student.admission_type === "FE" ? Number(student.admission_year) + 4 : Number(student.admission_year) + 3,
            created_at: new Date(),
            updated_at: new Date(),
        }));

        await queryInterface.bulkInsert('student_branch', studentBranches, {});
    },


    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('student_branch', null, {});
    }
};
