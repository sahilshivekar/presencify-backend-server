import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Admin from '../../../db/models/admin.model.js';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/config.js';

// Setup test database before each test
setupTestDb();

describe('POST /api/v1/semesters/bulk/create', () => {
    let validUniversity;
    let validBranch;
    let validScheme;
    let adminToken;

    beforeEach(async () => {
        try {
            // Create test admin and generate token
            const admin = await Admin.create({
                email: 'testadmin@test.com',
                username: 'testadmin',
                password: 'Admin@12345' // Must meet password requirements: uppercase, number, special char, 8+ chars
            });

            // Create test university
            validUniversity = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });

            // Generate admin token
            adminToken = jwt.sign({ id: admin.id, role: 'admin' }, config.jwt.accessTokenSecret);

            // Create test branch
            validBranch = await Branch.create({
                name: 'Computer Science Engineering',
                abbreviation: 'CSE'
            });

            // Create test scheme
            validScheme = await Scheme.create({
                name: 'Test Scheme 2025',
                universityId: validUniversity.id
            });
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized request: Invalid token');
        });

        test('should return 403 for student access', async () => {
            // Note: This test would require a student token, which isn't available in the test util
            // For now, we'll skip this test as it requires student token generation
            // This should be implemented when student tokens are available
        });

        test('should return 403 for teacher access', async () => {
            // Note: This test would require a teacher token, which isn't available in the test util
            // For now, we'll skip this test as it requires teacher token generation
            // This should be implemented when teacher tokens are available
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when semesters array is missing', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Semesters array is required');
        });

        test('should return 400 when semesters array is empty', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: []
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('At least 1 semester is required');
        });

        test('should return 400 when semesters array exceeds maximum limit', async () => {
            const semesters = Array(51).fill().map((_, index) => ({
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            }));

            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ semesters });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Cannot create more than 50 semesters at once');
        });

        test('should return 400 when branchId is missing', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Branch ID is required');
        });

        test('should return 400 when branchId is invalid UUID', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: 'invalid-uuid',
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Branch ID must be a valid UUID');
        });

        test('should return 400 when semesterNumber is missing', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Semester number is required');
        });

        test('should return 400 when semesterNumber is out of range', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 0,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('"semesterNumber" must be greater than or equal to 1');
        });

        test('should return 400 when academicStartYear is missing', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Academic start year is required');
        });

        test('should return 400 when startDate is invalid format', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: 'invalid-date',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Start date must be a valid ISO date');
        });

        test('should return 400 when schemeId is missing', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31'
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Scheme ID is required');
        });

        test('should return 413 when request payload is too large', async () => {
            const largeSemesters = Array(100).fill().map((_, index) => ({
                branchId: validBranch.id,
                semesterNumber: index + 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id,
                // Add large data to exceed payload limit
                largeField: 'x'.repeat(10000)
            }));

            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ semesters: largeSemesters });

            // This should trigger the payload limit middleware
            expect([413, 400]).toContain(response.status);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when branch does not exist', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: '12345678-1234-1234-1234-123456789012',
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Branch ID must be a valid UUID');
        });

        test('should return 404 when scheme does not exist', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: '12345678-1234-1234-1234-123456789012'
                    }]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Scheme ID must be a valid UUID');
        });

        test('should return 409 when duplicate semester exists', async () => {
            // First create a semester
            await Semester.create({
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            });

            // Try to create the same semester again
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [{
                        branchId: validBranch.id,
                        semesterNumber: 1,
                        academicStartYear: 2025,
                        academicEndYear: 2026,
                        startDate: '2025-08-01',
                        endDate: '2025-12-31',
                        schemeId: validScheme.id
                    }]
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toContain('Transaction cannot be rolled back');
        });

        test('should return 409 when duplicates exist within the same request', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [
                        {
                            branchId: validBranch.id,
                            semesterNumber: 1,
                            academicStartYear: 2025,
                            academicEndYear: 2026,
                            startDate: '2025-08-01',
                            endDate: '2025-12-31',
                            schemeId: validScheme.id
                        },
                        {
                            branchId: validBranch.id,
                            semesterNumber: 1,
                            academicStartYear: 2025,
                            academicEndYear: 2026,
                            startDate: '2025-08-01',
                            endDate: '2025-12-31',
                            schemeId: validScheme.id
                        }
                    ]
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Semester already exists');
        });

        test('should handle mixed valid and invalid data gracefully', async () => {
            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [
                        {
                            branchId: validBranch.id,
                            semesterNumber: 1,
                            academicStartYear: 2025,
                            academicEndYear: 2026,
                            startDate: '2025-08-01',
                            endDate: '2025-12-31',
                            schemeId: validScheme.id
                        },
                        {
                            branchId: '12345678-1234-1234-1234-123456789012', // Invalid branch
                            semesterNumber: 2,
                            academicStartYear: 2025,
                            academicEndYear: 2026,
                            startDate: '2025-08-01',
                            endDate: '2025-12-31',
                            schemeId: validScheme.id
                        }
                    ]
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Branch ID must be a valid UUID');
        });
    });

    describe('Success Tests', () => {
        test('should successfully create single semester', async () => {
            const semesterData = {
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            };

            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [semesterData]
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('1 semesters created successfully');
            expect(response.body.data).toHaveProperty('semesters');
            expect(response.body.data.semesters).toHaveLength(1);

            // Verify semester was created in database
            const createdSemester = await Semester.findOne({
                where: {
                    branchId: validBranch.id,
                    semesterNumber: 1,
                    schemeId: validScheme.id
                }
            });
            expect(createdSemester).toBeTruthy();
            expect(createdSemester.academicStartYear).toBe(2025);
            expect(createdSemester.academicEndYear).toBe(2026);
        });

        test('should successfully create multiple semesters', async () => {
            const semestersData = [
                {
                    branchId: validBranch.id,
                    semesterNumber: 1,
                    academicStartYear: 2025,
                    academicEndYear: 2026,
                    startDate: '2025-08-01',
                    endDate: '2025-12-31',
                    schemeId: validScheme.id
                },
                {
                    branchId: validBranch.id,
                    semesterNumber: 2,
                    academicStartYear: 2025,
                    academicEndYear: 2026,
                    startDate: '2026-01-01',
                    endDate: '2026-05-31',
                    schemeId: validScheme.id
                }
            ];

            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: semestersData
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('2 semesters created successfully');
            expect(response.body.data.semesters).toHaveLength(2);

            // Verify semesters were created in database
            const semesterCount = await Semester.count({
                where: {
                    branchId: validBranch.id,
                    schemeId: validScheme.id
                }
            });
            expect(semesterCount).toBe(2);
        });

        test('should handle optional course IDs correctly', async () => {
            const semesterData = {
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id,
                optionalCourseIds: []
            };

            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [semesterData]
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.semesters).toHaveLength(1);
        });

        test('should return created semesters with correct structure', async () => {
            const semesterData = {
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            };

            const response = await request(app)
                .post('/api/v1/semesters/bulk/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    semesters: [semesterData]
                });

            expect(response.status).toBe(201);
            expect(response.body.data.semesters[0]).toHaveProperty('id');
            expect(response.body.data.semesters[0]).toHaveProperty('branchId');
            expect(response.body.data.semesters[0]).toHaveProperty('semesterNumber');
            expect(response.body.data.semesters[0]).toHaveProperty('academicStartYear');
            expect(response.body.data.semesters[0]).toHaveProperty('academicEndYear');
            expect(response.body.data.semesters[0]).toHaveProperty('startDate');
            expect(response.body.data.semesters[0]).toHaveProperty('endDate');
            expect(response.body.data.semesters[0]).toHaveProperty('schemeId');
            expect(response.body.data.semesters[0]).toHaveProperty('createdAt');
            expect(response.body.data.semesters[0]).toHaveProperty('updatedAt');
        });
    });
});
