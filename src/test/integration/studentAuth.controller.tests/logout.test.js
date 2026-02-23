import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Student Auth API - logout', () => {
    let testStudent;
    let testUniversity;
    let testScheme;
    let testBranch;
    let studentToken;

    beforeEach(async () => {
        // Create test university
        testUniversity = await University.create({
            name: 'Test University',
            abbreviation: 'TU'
        });

        // Create test scheme
        testScheme = await Scheme.create({
            name: 'Test Scheme',
            universityId: testUniversity.id
        });

        // Create test branch
        testBranch = await Branch.create({
            name: 'Computer Science',
            abbreviation: 'CS'
        });

        // Create test student
        testStudent = await Student.create({
            prn: 'TU2025001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            phoneNumber: '1234567890',
            password: 'TestPass123!', // This should trigger password hashing hook
            schemeId: testScheme.id,
            branchId: testBranch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: "Male",
        });

        // Login to get token
        const loginRes = await request(app)
            .post('/api/v1/auth/students/login')
            .send({
                emailOrPRN: testStudent.email,
                password: 'TestPass123!'
            });

        studentToken = loginRes.body.data.accessToken;
    });

    describe('POST /api/v1/auth/students/logout', () => {
        test('should logout student successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/students/logout')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Logged out successfully');
            expect(res.body.data).toBe('If you are not accessing this api from a browser then you must manually remove the tokens stored');

            // Check cookies are cleared
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some(cookie => cookie.includes('studentAccessToken=;'))).toBe(true);
            expect(res.headers['set-cookie'].some(cookie => cookie.includes('studentRefreshToken=;'))).toBe(true);

            // Verify refresh token was set to null in DB
            const updatedStudent = await Student.findByPk(testStudent.id);
            expect(updatedStudent.refreshToken).toBeNull();
        });

        test('should return 401 when no authorization token is provided', async () => {
            const res = await request(app)
                .post('/api/v1/auth/students/logout')
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app)
                .post('/api/v1/auth/students/logout')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});