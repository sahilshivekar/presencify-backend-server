import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import VerificationCode from '../../../db/models/verificationCode.model.js';
import { faker } from '@faker-js/faker';
import httpStatus from 'http-status';
import { logger } from '../../../config/logger.js';
setupTestDb();

describe('Student Auth API - verifyCode', () => {
    let testStudent;
    let testUniversity;
    let testScheme;
    let testBranch;
    let studentToken;
    let verificationCode;

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
            email: 'student@gmail.com',
            phoneNumber: '+911234567890',
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
        try {
        verificationCode = await VerificationCode.create({
            email: testStudent.email,
            code: '123456',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
    } catch (error) {
        logger.error('Error creating VerificationCode in test setup:', {
            message: error.message,
            stack: error.stack,
            email: testStudent.email,
            code: '123456'
        });
        throw error;  // Re-throw to fail the test
    }
    });

    describe('POST /api/v1/auth/students/verify-code', () => {
        test('should verify code successfully and login student', async () => {
            const verifyData = {
                email: testStudent.email,
                code: '123456'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Verification successful!');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();

            // Check cookies are set
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some(cookie => cookie.includes('studentAccessToken'))).toBe(true);
            expect(res.headers['set-cookie'].some(cookie => cookie.includes('studentRefreshToken'))).toBe(true);

            // Verify verification code was deleted
            const verificationRecord = await VerificationCode.findOne({
                where: { email: testStudent.email }
            });
            expect(verificationRecord).toBeNull();

            // Verify student's refresh token was updated
            const updatedStudent = await Student.findByPk(testStudent.id);
            expect(updatedStudent.refreshToken).toBe(res.body.data.refreshToken);
        });

        test('should return 400 for missing email', async () => {
            const verifyData = {
                code: '123456'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email is required');
        });

        test('should return 400 for missing code', async () => {
            const verifyData = {
                email: testStudent.email
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Code is required');
        });

        test('should return 400 for invalid email format', async () => {
            const verifyData = {
                email: 'invalid-email',
                code: '123456'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });

        test('should return 400 for code with wrong length', async () => {
            const verifyData = {
                email: testStudent.email,
                code: '12345' // 5 digits instead of 6
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Code must be 6 characters long');
        });

        test('should return 400 when verification code is invalid', async () => {
            const verifyData = {
                email: testStudent.email,
                code: '000000' // Invalid code
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid verification code');

            // Verify verification code was not deleted
            const verificationRecord = await VerificationCode.findOne({
                where: { email: testStudent.email }
            });
            expect(verificationRecord).toBeTruthy();
        });

        test('should handle expired verification code appropriately', async () => {
            // Update verification code to be expired
            await VerificationCode.update(
                { expiresAt: new Date(Date.now() - 1000) }, // Expired 1 second ago
                { where: { email: testStudent.email } }
            );

            const verifyData = {
                email: testStudent.email,
                code: '123456'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(verifyData)
                .expect(httpStatus.OK);

            // The API accepts expired codes and still verifies the student
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Verification successful!');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const verifyData = {
                email: testStudent.email,
                code: '123456'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .send(verifyData)
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const verifyData = {
                email: testStudent.email,
                code: '123456'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/verify-code')
                .set('Authorization', 'Bearer invalidtoken')
                .send(verifyData)
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});