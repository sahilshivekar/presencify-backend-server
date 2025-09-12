import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { logger } from '../../../config/logger.js';
import { ROLES } from '../../../config/roles.js';
import { faker } from '@faker-js/faker';

setupTestDb();

describe('Student Auth API - postAccessToken', () => {
    let testStudent;
    let testUniversity;
    let testScheme;
    let testBranch;
    let validRefreshToken;
    let expiredRefreshToken;

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
            prn: 'TU2024001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            phoneNumber: '1234567890',
            password: 'TestPass123!', // This should trigger password hashing hook
            schemeId: testScheme.id,
            branchId: testBranch.id,
            admissionYear: 2024,
            admissionType: 'FE',
            gender: "Male",
        });

        // Generate valid refresh token
        validRefreshToken = jwt.sign(
            {
                id: testStudent.id,
                email: testStudent.email,
                role: 'STUDENT'
            },
            process.env.JWT_REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '15d'
            }
        );

        // Generate expired refresh token
        expiredRefreshToken = jwt.sign(
            {
                id: testStudent.id,
                email: testStudent.email,
                role: 'STUDENT'
            },
            process.env.JWT_REFRESH_TOKEN_SECRET,
            {
                expiresIn: '1ms' // Immediately expired
            }
        );

        // Set the refresh token on the student
        testStudent.refreshToken = validRefreshToken;
        await testStudent.save();
    });

    describe('post /api/v1/auth/students/access-token', () => {
        test('should refresh access token successfully', async () => {
            const requestData = {
                refreshToken: `Bearer ${validRefreshToken}`
            };

            const res = await request(app)
                .post('/api/v1/auth/students/access-token')
                .send(requestData)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Access token refreshed successfully');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();

            // Check cookies are set
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some(cookie => cookie.includes('studentAccessToken'))).toBe(true);
            expect(res.headers['set-cookie'].some(cookie => cookie.includes('studentRefreshToken'))).toBe(true);

            // Verify student's refresh token was updated in DB
            const updatedStudent = await Student.findByPk(testStudent.id);
            expect(updatedStudent.refreshToken).toBe(res.body.data.refreshToken);
        });

        test('should handle refresh token without Bearer prefix', async () => {
            const requestData = {
                refreshToken: validRefreshToken
            };

            const res = await request(app)
                .post('/api/v1/auth/students/access-token')
                .send(requestData)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Access token refreshed successfully');
        });

        test('should return 401 when refresh token is invalid', async () => {
            const requestData = {
                refreshToken: 'Bearer invalidtoken'
            };

            const res = await request(app)
                .post('/api/v1/auth/students/access-token')
                .send(requestData)
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test('should return 401 when refresh token is expired', async () => {
            // Wait a bit for token to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            const requestData = {
                refreshToken: `Bearer ${expiredRefreshToken}`
            };

            const res = await request(app)
                .post('/api/v1/auth/students/access-token')
                .send(requestData)
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test('should return 401 when student with refresh token does not exist', async () => {
            // Create token with non-existent student ID
            const fakeToken = jwt.sign(
                {
                    id: faker.string.uuid(),
                    email: 'fake@test.com',
                    role: ROLES.STUDENT
                },
                process.env.JWT_REFRESH_TOKEN_SECRET,
                {
                    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '15d'
                }
            );

            const requestData = {
                refreshToken: `Bearer ${fakeToken}`
            };

            const res = await request(app)
                .post('/api/v1/auth/students/access-token')
                .send(requestData)
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Student with this refresh token doesn\'t exist');
        });

        test('should return 400 when refresh token is missing', async () => {
            const requestData = {};

            const res = await request(app)
                .post('/api/v1/auth/students/access-token')
                .send(requestData)
                .expect(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Refresh token is required');


        });
    });
});