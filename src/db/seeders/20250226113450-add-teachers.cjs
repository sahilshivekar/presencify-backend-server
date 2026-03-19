'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // Import the uuid function

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const password = await bcrypt.hash(
            'Sahil@124',
            Number(process.env.BCRYPT_SALT))

        let teacherCounter = 1;

        const teacherMembersDetails = [
            { firstName: "Neha", lastName: "Calhoun", gender: "Female", role: "Principal" },
            { firstName: "Rakesh", lastName: "Cunningham", gender: "Male", role: "Head of Department" },
            { firstName: "Amit", lastName: "Chopra", gender: "Male", role: "Teacher" },
            { firstName: "Priya", lastName: "Clements", gender: "Female", role: "Teacher" },
            { firstName: "Simran", lastName: "Cabrera", gender: "Female", role: "Teacher" },
            { firstName: "Vikram", lastName: "Carpenter", gender: "Male", role: "Teacher" },
            { firstName: "Sunita", lastName: "Carrillo", gender: "Female", role: "Teacher" },
            { firstName: "Raj", lastName: "Casanova", gender: "Male", role: "Teacher" },
            { firstName: "Anjali", lastName: "Cassidy", gender: "Female", role: "Teacher" },
            { firstName: "Mohit", lastName: "Castaneda", gender: "Male", role: "Teacher" },
            { firstName: "Deepika", lastName: "Chamberlain", gender: "Female", role: "Teacher" },
            { firstName: "Gaurav", lastName: "Chandler", gender: "Male", role: "Teacher" },
            { firstName: "Nisha", lastName: "Chapman", gender: "Female", role: "Teacher" },
            { firstName: "Karan", lastName: "Charlton", gender: "Male", role: "Teacher" },
            { firstName: "Rohit", lastName: "Chen", gender: "Male", role: "Teacher" },
            { firstName: "Meera", lastName: "Churchill", gender: "Female", role: "Teacher" },
            { firstName: "Sandeep", lastName: "Cisneros", gender: "Male", role: "Teacher" },
            { firstName: "Pooja", lastName: "Clark", gender: "Female", role: "Teacher" },
            { firstName: "Vivek", lastName: "Clarke", gender: "Male", role: "Teacher" },
            { firstName: "Sonia", lastName: "Clements", gender: "Female", role: "Teacher" },
            { firstName: "Sahil", lastName: "Shivekar", gender: "Male", role: "Teacher" }
        ];

        // The .map is synchronous here since bcrypt.hash is awaited beforehand
        const teacherMembers = teacherMembersDetails.map((teacher) => ({
            teacher_id: uuidv4(), // Generate a UUID for each teacher
            first_name: teacher.firstName,
            last_name: teacher.lastName,
            middle_name: null,
            teacher_email: `${teacher.firstName.toLowerCase()}${teacher.lastName.toLowerCase()}124@gmail.com`,
            teacher_phone_number: `+91${9000000000 + teacherCounter++}`,
            teacher_gender: teacher.gender,
            teacher_highest_qualification: "M.Tech",
            teacher_role: teacher.role,
            teacher_password: password,
            is_active: true,
            teacher_image_url: null,
            teacher_image_public_id: null,
            refresh_token: null,
            created_at: new Date(),
            updated_at: new Date(),
        }));

        await queryInterface.bulkInsert("teacher", teacherMembers);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("teacher", null, {})
    }
};