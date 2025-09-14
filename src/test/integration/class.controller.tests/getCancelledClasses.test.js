import { jest } from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

// Models
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Batch from '../../../db/models/batch.model.js';
import Course from '../../../db/models/course.model.js';
import Room from '../../../db/models/room.model.js';
import Timetable from '../../../db/models/timetable.model.js';
import Class from '../../../db/models/class.model.js';
import CancelledClass from '../../../db/models/cancelledClass.model.js';

setupTestDb();

/**
 * Notes
 * - Route: GET /api/v1/classes/cancelled
 * - Auth: Admin, Teacher, Student allowed
 * - Validation: see validators/class.validation.js#getCancelledClasses
 * - Behavior: Optional filters by date, divisionId (via timetable), batchId; pagination with page/limit unless getAll=true
 */

describe('Class API - getCancelledClasses', () => {
  let adminToken;
  let teacherToken;
  let studentToken;

  // Shared entities
  let university;
  let branch;
  let scheme;
  let semester;
  let divisionA;
  let divisionB;
  let divisionNoTimetable; // For 404 case
  let batchA1;
  let batchA2;
  let batchB1;
  let coursePF;
  let room101;
  let timetableA;
  let timetableB;
  let teacherJohn;
  let student;

  // Classes
  let classALecture; // division A, no batch
  let classAPracticalA1; // division A, batch A1
  let classBPracticalB1; // division B, batch B1

  beforeEach(async () => {
    // Admin + login
    await Admin.create({ email: 'admin@example.com', username: 'adminuser', password: 'Admin@12345' });
    const adminLogin = await request(app)
      .post('/api/v1/auth/admins/login')
      .send({ emailOrUsername: 'admin@example.com', password: 'Admin@12345' });
    adminToken = adminLogin.body.data.accessToken;

    // Teacher + login
    teacherJohn = await Teacher.create({
      firstName: 'John', lastName: 'Doe', email: 'teacher@example.com', phoneNumber: '+911234567890', password: 'Teacher@123', gender: 'Male', role: 'Teacher'
    });
    const teacherLogin = await request(app)
      .post('/api/v1/auth/teachers/login')
      .send({ email: 'teacher@example.com', password: 'Teacher@123' });
    teacherToken = teacherLogin.body.data.accessToken;

    // Academic setup
    university = await University.create({ name: 'Test University', abbreviation: 'TU' });
    branch = await Branch.create({ name: 'Computer Science', abbreviation: 'CS' });
    scheme = await Scheme.create({ name: 'CS 2025 Scheme', universityId: university.id });
    semester = await Semester.create({
      semesterNumber: 1,
      branchId: branch.id,
      academicStartYear: 2024,
      academicEndYear: 2025,
      startDate: '2024-08-01',
      endDate: '2024-12-31',
      schemeId: scheme.id,
    });
    divisionA = await Division.create({ divisionCode: 'A', semesterId: semester.id });
    divisionB = await Division.create({ divisionCode: 'B', semesterId: semester.id });
    divisionNoTimetable = await Division.create({ divisionCode: 'C', semesterId: semester.id });

    // Batches
    batchA1 = await Batch.create({ batchCode: 'A1', divisionId: divisionA.id });
    batchA2 = await Batch.create({ batchCode: 'A2', divisionId: divisionA.id });
    batchB1 = await Batch.create({ batchCode: 'B1', divisionId: divisionB.id });

    // Course & Room
    coursePF = await Course.create({ name: 'Programming Fundamentals', code: 'CS101', schemeId: scheme.id });
    room101 = await Room.create({ roomNumber: '101', sittingCapacity: 60 });

    // Timetables
    timetableA = await Timetable.create({ divisionId: divisionA.id });
    timetableB = await Timetable.create({ divisionId: divisionB.id });

    // A student for auth (Student role is allowed for GET)
    student = await Student.create({
      firstName: 'Jane', lastName: 'Smith', email: 'student@example.com', phoneNumber: '+919876543210', prn: 'STU001', password: 'Student@123', schemeId: scheme.id, branchId: branch.id, admissionYear: 2024, admissionType: 'FE', gender: 'Female'
    });
    const studentLogin = await request(app).post('/api/v1/auth/students/login').send({ emailOrPRN: 'student@example.com', password: 'Student@123' });
    studentToken = studentLogin.body.data.accessToken;

    // Classes under respective timetables
    classALecture = await Class.create({
      teacherId: teacherJohn.id,
      startTime: '09:00:00', endTime: '10:00:00', dayOfWeek: 'Monday',
      roomId: room101.id, batchId: null,
      activeFrom: '2024-08-01', activeTill: '2024-12-31',
      classType: 'Lecture', courseId: coursePF.id, timetableId: timetableA.id, isExtraClass: false
    });

    classAPracticalA1 = await Class.create({
      teacherId: teacherJohn.id,
      startTime: '10:00:00', endTime: '11:00:00', dayOfWeek: 'Monday',
      roomId: room101.id, batchId: batchA1.id,
      activeFrom: '2024-08-01', activeTill: '2024-12-31',
      classType: 'Practical', courseId: coursePF.id, timetableId: timetableA.id, isExtraClass: false
    });

    classBPracticalB1 = await Class.create({
      teacherId: teacherJohn.id,
      startTime: '11:00:00', endTime: '12:00:00', dayOfWeek: 'Tuesday',
      roomId: room101.id, batchId: batchB1.id,
      activeFrom: '2024-08-01', activeTill: '2024-12-31',
      classType: 'Practical', courseId: coursePF.id, timetableId: timetableB.id, isExtraClass: false
    });

    // Cancelled records on different dates
    await CancelledClass.create({ classId: classALecture.id, date: '2024-09-10', reason: 'Holiday' });
    await CancelledClass.create({ classId: classBPracticalB1.id, date: '2024-09-10', reason: 'Event' });
    await CancelledClass.create({ classId: classAPracticalA1.id, date: '2024-09-11', reason: 'Maintenance' });
  });

  const url = '/api/v1/classes/cancelled';

  describe('Authentication', () => {
    test('should return 401 if no token provided', async () => {
      const res = await request(app).get(url);
      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    test('should return 401 if invalid token provided', async () => {
      const res = await request(app).get(url).set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(httpStatus.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid token');
    });

    test('should allow admin, teacher and student', async () => {
      const asAdmin = await request(app).get(url).set('Authorization', `Bearer ${adminToken}`);
      expect(asAdmin.status).toBe(httpStatus.OK);

      const asTeacher = await request(app).get(url).set('Authorization', `Bearer ${teacherToken}`);
      expect(asTeacher.status).toBe(httpStatus.OK);

      const asStudent = await request(app).get(url).set('Authorization', `Bearer ${studentToken}`);
      expect(asStudent.status).toBe(httpStatus.OK);
    });
  });

  describe('Validation', () => {
    test('should return 400 for invalid divisionId', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ divisionId: 'not-a-uuid' });
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid UUID');
    });

    test('should return 400 for invalid batchId', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ batchId: 'not-a-uuid' });
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid UUID');
    });

    test('should return 400 for invalid date format', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ date: 'invalid-date' });
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('date');
    });
  });

  describe('Not Found', () => {
    test('should return 404 if division has no timetable', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ divisionId: divisionNoTimetable.id });
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Timetable not found');
    });
  });

  describe('Filtering', () => {
    test('should return all cancelled classes without filters', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toHaveProperty('cancelledClasses');
      expect(res.body.data).toHaveProperty('totalCount');
      expect(res.body.data.totalCount).toBe(3);
      expect(res.body.data.cancelledClasses.length).toBeGreaterThan(0);
    });

    test('should filter by date', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ date: '2024-09-10' });
      expect(res.status).toBe(httpStatus.OK);
      const rows = res.body.data.cancelledClasses;
      expect(rows.length).toBe(2);
      expect(rows.every(r => r.date === '2024-09-10')).toBe(true);
    });

    test('should filter by divisionId (via timetable)', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ divisionId: divisionA.id });
      expect(res.status).toBe(httpStatus.OK);
      const ids = res.body.data.cancelledClasses.map(cc => cc.classId);
      // Only classes from timetableA: classALecture and classAPracticalA1 => both cancelled (two different dates)
      expect(ids).toEqual(expect.arrayContaining([classALecture.id, classAPracticalA1.id]));
      // Should not include division B class cancellation
      expect(ids).not.toContain(classBPracticalB1.id);
    });

    test('should filter by batchId', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ batchId: batchB1.id });
      expect(res.status).toBe(httpStatus.OK);
      const ids = res.body.data.cancelledClasses.map(cc => cc.classId);
      expect(ids).toEqual([classBPracticalB1.id]);
    });

    test('should support combined divisionId and batchId filters', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ divisionId: divisionA.id, batchId: batchA1.id });
      expect(res.status).toBe(httpStatus.OK);
      const ids = res.body.data.cancelledClasses.map(cc => cc.classId);
      expect(ids).toEqual([classAPracticalA1.id]);
    });
  });

  describe('Pagination', () => {
    test('should apply page and limit', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, limit: 1 });
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data.cancelledClasses.length).toBeLessThanOrEqual(1);
      expect(res.body.data.totalCount).toBe(3);
    });

    test('should ignore pagination when getAll=true', async () => {
      const res = await request(app)
        .get(url)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ getAll: true, limit: 1 });
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data.cancelledClasses.length).toBe(3);
    });
  });
});
