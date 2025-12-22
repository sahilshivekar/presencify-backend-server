'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (queryInterface.sequelize.getDialect() !== 'postgres') return;
    // Add capitalized enum values if not exist
    await queryInterface.sequelize.query("ALTER TYPE \"enum_rooms_room_type\" ADD VALUE IF NOT EXISTS 'Classroom';");
    await queryInterface.sequelize.query("ALTER TYPE \"enum_rooms_room_type\" ADD VALUE IF NOT EXISTS 'Lab';");
    await queryInterface.sequelize.query("ALTER TYPE \"enum_rooms_room_type\" ADD VALUE IF NOT EXISTS 'Office';");
  },
  async down(queryInterface, Sequelize) {
    // Postgres does not support removing enum values easily; keep as no-op
  }
};
