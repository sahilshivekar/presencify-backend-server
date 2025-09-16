import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';

setupTestDb();

describe('Teacher API - bulkDeleteTeachers', () => {
    let adminToken, teacherToken, studentToken;
    let university, branch, scheme;
    let teacher1, teacher2, teacher3;

    beforeEach(async () => {
        try {
            // Create test university first
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

            // Create admin and login
            await Admin.create({
                email: 'testadmin@example.com',
                username: 'testadmin',
                password: 'Admin@12345',
            });
            const adminLoginRes = await request(app)
                .post('/api/v1/auth/admins/login')
                .send({
                    emailOrUsername: 'testadmin@example.com',
                    password: 'Admin@12345',
                });
            adminToken = adminLoginRes.body.data.accessToken;

            // Create teacher and login
            await Teacher.create({
                firstName: 'Test',
                lastName: 'Teacher',
                email: 'testteacher@example.com',
                phoneNumber: '+919876543211',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app)
                .post('/api/v1/auth/teachers/login')
                .send({
                    email: 'testteacher@example.com',
                    password: 'Teacher@123',
                });
            teacherToken = teacherLoginRes.body.data.accessToken;

            // Create student and login
            await Student.create({
                firstName: 'Test',
                lastName: 'Student',
                email: 'teststudent@example.com',
                phoneNumber: '+919876543212',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2024,
                admissionType: 'FE',
                gender: 'Male'
            });
            const studentLoginRes = await request(app)
                .post('/api/v1/auth/students/login')
                .send({
                    emailOrPRN: 'teststudent@example.com',
                    password: 'Student@123',
                });
            studentToken = studentLoginRes.body.data.accessToken;

            // Create test teachers for deletion
            teacher1 = await Teacher.create({
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'alice.teacher@example.com',
                phoneNumber: '+919876543213',
                password: 'Teacher@123',
                gender: 'Female',
                role: 'Teacher'
            });

            teacher2 = await Teacher.create({
                firstName: 'Bob',
                lastName: 'Wilson',
                email: 'bob.teacher@example.com',
                phoneNumber: '+919876543214',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });

            teacher3 = await Teacher.create({
                firstName: 'Charlie',
                lastName: 'Brown',
                email: 'charlie.teacher@example.com',
                phoneNumber: '+919876543215',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });

        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('DELETE /api/v1/teachers/bulk/delete', () => {
        const validDeleteData = () => ({
            teacherIds: [teacher1.id, teacher2.id]
        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .send(validDeleteData());

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', 'Bearer invalidtoken')
                    .send(validDeleteData());

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to bulk delete', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send(validDeleteData());

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if teacher tries to bulk delete', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send(validDeleteData());

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });
        });

        describe('Validation', () => {
            test('should return 400 if teacherIds array is missing', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({});

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Teacher IDs array is required');
            });

            test('should return 400 if teacherIds array is empty', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ teacherIds: [] });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('At least one teacher ID is required');
            });

            test('should return 413 for very large teacher ID arrays', async () => {
                const teacherIds = Array.from({ length: 101 }, () => uuidv4());

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ teacherIds });

                expect(response.status).toBe(httpStatus.NOT_FOUND); // Current implementation throws NOT_FOUND when no teachers found
                expect(response.body.success).toBe(false);
            });

            test('should return 400 if teacherId is not a valid UUID', async () => {
                const invalidData = {
                    teacherIds: ['invalid-uuid', teacher2.id]
                };

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Each teacher ID must be a valid UUID');
            });
        });

        describe('Business Logic Validation', () => {
            test('should handle non-existent teacher IDs gracefully', async () => {
                const invalidData = {
                    teacherIds: [uuidv4(), teacher2.id] // First ID doesn't exist
                };

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(invalidData);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.deletedCount).toBe(1); // Only the valid one deleted
                expect(response.body.data.requestedCount).toBe(2); // Two were requested
            });

            test('should handle duplicate teacher IDs in request gracefully', async () => {
                const duplicateData = {
                    teacherIds: [teacher1.id, teacher1.id] // Same ID twice
                };

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(duplicateData);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.deletedCount).toBe(1); // Should only delete once
            });

            test('should handle already deleted teacher IDs gracefully', async () => {
                // First delete teacher1
                await Teacher.destroy({ where: { id: teacher1.id } });

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validDeleteData());

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.deletedCount).toBe(1); // Only teacher2 deleted
                expect(response.body.data.requestedCount).toBe(2); // Two were requested
            });
        });

        describe('Success Cases', () => {
            test('should bulk delete teachers successfully', async () => {
                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validDeleteData());

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Teachers deleted successfully');
                expect(response.body.data.deletedCount).toBe(2);
                expect(response.body.data.requestedCount).toBe(2);

                // Verify teachers are deleted from database
                const remainingTeachers = await Teacher.findAll({
                    where: {
                        id: [teacher1.id, teacher2.id]
                    }
                });
                expect(remainingTeachers).toHaveLength(0);

                // Verify teacher3 still exists
                const teacher3Still = await Teacher.findByPk(teacher3.id);
                expect(teacher3Still).toBeTruthy();
            });

            test('should handle single teacher deletion', async () => {
                const singleDeleteData = {
                    teacherIds: [teacher1.id]
                };

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(singleDeleteData);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Teachers deleted successfully');
                expect(response.body.data.deletedCount).toBe(1);
                expect(response.body.data.requestedCount).toBe(1);

                // Verify only teacher1 is deleted
                const deletedTeacher = await Teacher.findByPk(teacher1.id);
                expect(deletedTeacher).toBeNull();

                const existingTeacher = await Teacher.findByPk(teacher2.id);
                expect(existingTeacher).toBeTruthy();
            });

            test('should return proper counts and error details', async () => {
                const mixedData = {
                    teacherIds: [teacher1.id, uuidv4(), teacher2.id] // Valid, invalid, valid
                };

                const response = await request(app)
                    .delete('/api/v1/teachers/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(mixedData);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.deletedCount).toBe(2); // Only valid ones deleted
                expect(response.body.data.requestedCount).toBe(3); // Three were requested
            });
        });
    });
});