'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            -- sem 1 & 2 all branch have same nep 2020 scheme
            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 1
            FROM Courses
            WHERE course_code IN ('BSC101', 'BSC101', 'BSC102', 'BSC103', 'ESC101', 'ESC102', 'BSL101', 'BSL102', 'ESL101', 'ESL102', 'AEC101', 'AEL101', 'SEC101', 'VSEC102', 'CC101');


            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 2
            FROM Courses
            WHERE course_code IN ('BSC201', 'BSC201', 'BSC202X', 'BSC203X', 'ESC201', 'PCC201X', 'BSL201X', 'BSL202X', 'ESL201', 'PCL201X', 'CC201', 'IKS201', 'VSEC201', 'VSEC202');



            -- sem 3 to 8 comp rev - 19 c scheme
            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 3
            FROM Courses
            WHERE course_code IN ('CSC301', 'CSC302', 'CSC303', 'CSC304', 'CSC305', 'CSL301', 'CSL302', 'CSL303', 'CSL304', 'CSM301');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 4
            FROM Courses
            WHERE course_code IN ('CSC401', 'CSC402', 'CSC403', 'CSC404', 'CSC405', 'CSL401', 'CSL402', 'CSL403', 'CSL404', 'CSL405', 'CSM401');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 5
            FROM Courses
            WHERE course_code IN ('CSC501', 'CSC502', 'CSC503', 'CSC504', 'CSDLO5011', 'CSDLO5012', 'CSDLO5013', 'CSL501', 'CSL502', 'CSL503', 'CSL504', 'CSM501');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 6
            FROM Courses
            WHERE course_code IN ('CSC601', 'CSC602', 'CSC603', 'CSC604', 'CSDLO6011', 'CSDLO6012', 'CSDLO6013', 'CSL601', 'CSL602', 'CSL603', 'CSL604', 'CSL605', 'CSM601');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 7
            FROM Courses
            WHERE course_code IN ('CSC701', 'CSC702', 'CSDC7011', 'CSDC7012', 'CSDC7013', 'CSDL7011', 'CSDL7012', 'CSDL7013', 'CSDC7021', 'CSDC7022', 'CSDC7023', 'CSDL7021', 'CSDL7022', 'CSDL7023', 'ILO7011', 'ILO7012', 'ILO7013', 'ILO7014', 'ILO7015', 'ILO7016', 'ILO7017', 'ILO7018', 'ILO7019', 'CSL701', 'CSL702', 'CSP701');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 1, course_id, 8
            FROM Courses
            WHERE course_code IN ('CSC801', 'CSL801', 'CSP801', 'CSDC8011', 'CSDC8012', 'CSDC8013', 'CSDL8011', 'CSDL8012', 'CSDL8013', 'CSDC8021', 'CSDC8022', 'CSDC8023', 'CSDL8021', 'CSDL8022', 'CSDL8023', 'ILO8021', 'ILO8022', 'ILO8023', 'ILO8024', 'ILO8025', 'ILO8026', 'ILO8027', 'ILO8028', 'ILO8029');

            -- sem 3 to 8 civil rev -2019 c scheme
            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 2, course_id, 3
            FROM Courses
            WHERE course_code IN ('CEC301', 'CEC302', 'CEC303', 'CEC304', 'CEC305', 'CEL301', 'CEL302', 'CEL303', 'CEL304', 'CEL305', 'CEM301');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 2, course_id, 4
            FROM Courses
            WHERE course_code IN ('CEC401', 'CEC402', 'CEC403', 'CEC404', 'CEC405', 'CEL401', 'CEL402', 'CEL403', 'CEL404', 'CEL405', 'CEM401');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 2, course_id, 5
            FROM Courses
            WHERE course_code IN ('CEC501', 'CEC502', 'CEC503', 'CEC504', 'CEL501', 'CEL502', 'CEL503', 'CEL504', 'CEL505', 'CEM501', 'CEDLO5011', 'CEDLO5012', 'CEDLO5013', 'CEDLO5014', 'CEDLO5015', 'CEDLO5016', 'CEDLO5017');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 2, course_id, 6
            FROM Courses
            WHERE course_code IN ('CEC601', 'CEC602', 'CEC603', 'CEC604', 'CEL601', 'CEL602', 'CEL603', 'CEL604', 'CEL605', 'CEM601', 'CEDLO6011', 'CEDLO6012', 'CEDLO6013', 'CEDLO6014', 'CEDLO6015', 'CEDLO6016', 'CEDLO6017', 'CEDLO6018');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 2, course_id, 7
            FROM Courses
            WHERE course_code IN ('CEC701', 'CEC702', 'CEL701', 'CEL702', 'CEP701', 'CEDLO7011', 'CEDLO7012', 'CEDLO7013', 'CEDLO7014', 'CEDLO7015', 'CEDLO7016', 'CEDLO7021', 'CEDLO7022', 'CEDLO7023', 'CEDLO7024', 'CEDLO7025', 'CEDLO7026', 'CEDLO7027', 'ILO7011', 'ILO7012', 'ILO7013', 'ILO7014', 'ILO7015', 'ILO7016', 'ILO7017', 'ILO7018', 'ILO7019');

            INSERT INTO branch_course_semesters (branch_id, course_id, semester_number)
            SELECT 2, course_id, 8
            FROM Courses
            WHERE course_code IN ('CEC801', 'CEL801', 'CEP801', 'CEDLO8011', 'CEDLO8012', 'CEDLO8013', 'CEDLO8014', 'CEDLO8015', 'CEDLO8016', 'CEDLO8021', 'CEDLO8022', 'CEDLO8023', 'CEDLO8024', 'CEDLO8025', 'CEDLO8026', 'ILO8021', 'ILO8022', 'ILO8023', 'ILO8024', 'ILO8025', 'ILO8026', 'ILO8027', 'ILO8028', 'ILO8029');
    `)
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`delete from branch_course_semesters`)
    }
};
