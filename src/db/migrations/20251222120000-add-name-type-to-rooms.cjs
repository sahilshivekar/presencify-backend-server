'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add room_name column (nullable string)
        await queryInterface.addColumn('rooms', 'room_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        // Add room_type column (nullable enum)
        await queryInterface.addColumn('rooms', 'room_type', {
            type: Sequelize.ENUM('Classroom', 'Lab', 'Office'),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove enum column first, then drop enum type (Postgres)
        await queryInterface.removeColumn('rooms', 'room_type');
        // Drop the underlying enum type that Sequelize created
        // Default name pattern: enum_<table>_<column>
        if (queryInterface.sequelize.getDialect() === 'postgres') {
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rooms_room_type";');
        }

        await queryInterface.removeColumn('rooms', 'room_name');
    }
};
