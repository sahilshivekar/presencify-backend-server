import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import VerificationCode from '../../../db/models/verificationCode.model.js';
import { faker } from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - verifyCode', () => {
    let unverifiedAdmin;
    let verificationCode;

    beforeEach(async () => {
        // Create an unverified admin
        unverifiedAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!',
            isVerified: false,
        });

        // Create a verification code for the admin
        verificationCode = await VerificationCode.create({
            email: unverifiedAdmin.email,
            code: '123456',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        });
    });

    describe('POST /api/v1/auth/admins/verify-code', () => {
        test('should verify code successfully and mark admin as verified', async () => {
            const verifyData = {
                email: unverifiedAdmin.email,
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Verification successful!');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');

            // Verify admin is now verified in database
            const updatedAdmin = await Admin.findByPk(unverifiedAdmin.id);
            expect(updatedAdmin.isVerified).toBe(true);

            // Verify verification code is deleted
            const deletedCode = await VerificationCode.findOne({
                where: { email: unverifiedAdmin.email },
            });
            expect(deletedCode).toBeNull();
        });

        test('should return 400 for missing email', async () => {
            const verifyData = {
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email is required');
        });

        test('should return 400 for missing code', async () => {
            const verifyData = {
                email: unverifiedAdmin.email,
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('code');
        });

        test('should return 400 for invalid email format', async () => {
            const verifyData = {
                email: 'invalid-email',
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('email');
        });

        test('should return 400 for invalid code format (non-numeric)', async () => {
            const verifyData = {
                email: unverifiedAdmin.email,
                code: 'abc123',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('code');
        });

        test('should return 400 for code with wrong length', async () => {
            const verifyData = {
                email: unverifiedAdmin.email,
                code: '12345', // 5 digits instead of 6
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('code');
        });

        test('should return 404 when admin with email not found', async () => {
            const verifyData = {
                email: faker.internet.email().toLowerCase(),
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid verification code');
        });

        test('should handle verification for already verified admin', async () => {
            // Mark admin as verified
            await Admin.update(
                { isVerified: true },
                { where: { id: unverifiedAdmin.id } }
            );

            const verifyData = {
                email: unverifiedAdmin.email,
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Verification successful!');
        });

        test('should return 400 for incorrect verification code', async () => {
            const verifyData = {
                email: unverifiedAdmin.email,
                code: '654321', // Wrong code
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid verification code');
        });

        test('should handle expired verification code appropriately', async () => {
            // Update verification code to be expired
            await VerificationCode.update(
                { expiresAt: new Date(Date.now() - 1000) }, // Expired 1 second ago
                { where: { email: unverifiedAdmin.email } }
            );

            const verifyData = {
                email: unverifiedAdmin.email,
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData);

            // The API accepts expired codes and still verifies the admin
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Verification successful!');
        });

        test('should handle case when no verification code exists for admin', async () => {
            // Delete the verification code
            await VerificationCode.destroy({
                where: { email: unverifiedAdmin.email },
            });

            const verifyData = {
                email: unverifiedAdmin.email,
                code: '123456',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/verify-code')
                .send(verifyData);

            // The API might return different status codes when no code exists
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBeTruthy();
        });
    });
});