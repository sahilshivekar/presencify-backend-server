'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const rooms = [];

        // Function to generate a random number between min and max (inclusive)
        const getRandomCapacity = () => Math.floor(Math.random() * (70 - 30 + 1)) + 30;

        // Define room numbers
        const roomNumbers = [
            ...Array.from({ length: 8 }, (_, i) => `00${i + 1}`),  // 001...008
            ...Array.from({ length: 9 }, (_, i) => `10${i + 1}`),  // 101...109
            ...Array.from({ length: 5 }, (_, i) => `20${i + 1}`),  // 201...205
            ...Array.from({ length: 5 }, (_, i) => `30${i + 1}`),  // 301...305
            ...Array.from({ length: 5 }, (_, i) => `40${i + 1}`),  // 401...405
            ...Array.from({ length: 5 }, (_, i) => `50${i + 1}`),  // 501...505
            ...Array.from({ length: 5 }, (_, i) => `60${i + 1}`),  // 601...605
            ...Array.from({ length: 5 }, (_, i) => `70${i + 1}`)   // 701...705
        ];

        // Create room objects
        roomNumbers.forEach((roomNumber) => {
            rooms.push({
                room_number: parseInt(roomNumber, 10),  // Convert to integer
                sitting_capacity: getRandomCapacity(),
                created_at: new Date(),
                updated_at: new Date()
            });
        });

        await queryInterface.bulkInsert('rooms', rooms, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('rooms', null, {});
    }
};
