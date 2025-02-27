'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const password = await bcrypt.hash(
            'Teacher@123',
            Number(process.env.BCRYPT_SALT))

        let staffCounter = 1;

        const staffMembersDetails = [
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
            { firstName: "Sonia", lastName: "Clements", gender: "Female", role: "Teacher" }
        ];

        const staffMembers = await Promise.all(staffMembersDetails.map(async (staff, index) => ({
            staff_id: index + 1,
            first_name: staff.firstName,
            last_name: staff.lastName,
            middle_name: null,
            staff_email: `${staff.firstName.toLowerCase()}.${staff.lastName.toLowerCase()}@gmail.com`,
            staff_phone_number: `+91${9000000000 + staffCounter++}`,
            staff_gender: staff.gender,
            staff_highest_qualification: "M.Tech",
            staff_role: staff.role,
            staff_password: password,
            is_active: true,
            staff_image_url: null,
            staff_image_public_id: null,
            refresh_token: null,
            created_at: new Date(),
            updated_at: new Date(),
        })));

        await queryInterface.bulkInsert("staff", staffMembers);

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("staff", null, {})
    }
};
