import { jest } from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

// Models
import Admin from '../../../db/models/admin.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Batch from '../../../db/models/batch.model.js';
import Course from '../../../db/models/course.model.js';
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';

setupTestDb();

describe('Course Controller Integration', () => {
  let adminToken;
  let university;
  let branch;
  let scheme;
  let semester;
  let division;
  let batch;
  let course;
  let course2;
  let branchCourseSemester;

  beforeEach(async () => {
    // Create admin and login
    await Admin.create({
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'Admin@12345',
    });
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/admins/login')
      .send({
        emailOrUsername: 'admin@example.com',
        password: 'Admin@12345',
      });
    adminToken = adminLoginRes.body.data.accessToken;

    university = await University.create({
      name: 'Test University',
      abbreviation: 'TU',
    });
    branch = await Branch.create({
      name: 'Computer Science',
      abbreviation: 'CS',
    });
    scheme = await Scheme.create({
      name: 'CS 2025 Scheme',
      universityId: university.id,
    });
    semester = await Semester.create({
      semesterNumber: 1,
      branchId: branch.id,
      academicStartYear: 2024,
      academicEndYear: 2025,
      startDate: '2024-08-01',
      endDate: '2024-12-31',
      schemeId: scheme.id,
    });
    division = await Division.create({
      divisionCode: 'A',
      semesterId: semester.id,
    });
    batch = await Batch.create({
      batchCode: 'Batch 1',
      divisionId: division.id,
    });
    course = await Course.create({
      name: 'Programming Fundamentals',
      code: 'CS101',
      schemeId: scheme.id,
      optionalSubject: null,
    });
    course2 = await Course.create({
      name: 'Data Structures',
      code: 'CS201',
      schemeId: scheme.id,
      optionalSubject: null,
    });
    branchCourseSemester = await BranchCourseSemester.create({
      branchId: branch.id,
      courseId: course.id,
      semesterNumber: semester.semesterNumber,
    });
  });

  // Test cases for each controller will be added here
});