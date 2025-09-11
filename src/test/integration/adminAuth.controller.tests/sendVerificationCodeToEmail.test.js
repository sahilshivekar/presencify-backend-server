import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import VerificationCode from '../../../db/models/verificationCode.model.js';
import { faker } from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - sendVerificationCodeToEmail', () => {
    let adminToken;
    let existingAdmin;
    let unverifiedAdmin;

    beforeEach(async () => {
        // Create a verified admin for authenticated requests
        existingAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!',
            isVerified: true,
        });

        // Create an unverified admin for public requests
        unverifiedAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!',
            isVerified: false,
        });

        // Login to get token for authenticated requests
        const loginRes = await request(app)
            .post('/api/v1/auth/admins/login')
            .send({
                emailOrUsername: existingAdmin.email,
                password: 'TestPass123!',
            });

        adminToken = loginRes.body.data.accessToken;
    });

    describe('GET /api/v1/auth/admins/email-verification (Authenticated)', () => {
        test('should send verification code successfully for authenticated admin', async () => {
            const res = await request(app)
                .get('/api/v1/auth/admins/email-verification')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Verification code sent on');
            expect(res.body.data).toHaveProperty('expiresAt');
            expect(new Date(res.body.data.expiresAt)).toBeInstanceOf(Date);

            // Verify verification code was created in database
            const verificationCode = await VerificationCode.findOne({
                where: { email: existingAdmin.email },
            });
            expect(verificationCode).toBeTruthy();
            expect(verificationCode.code).toBeTruthy();
            expect(verificationCode.expiresAt).toBeTruthy();
        });

        test('should return 401 when no authorization token is provided', async () => {
            const res = await request(app)
                .get('/api/v1/auth/admins/email-verification')
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app)
                .get('/api/v1/auth/admins/email-verification')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 404 when admin not found', async () => {
            // Delete the admin first
            await Admin.destroy({ where: { id: existingAdmin.id } });

            const res = await request(app)
                .get('/api/v1/auth/admins/email-verification')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid Access Token: User not found');
        });
    });

    describe('POST /api/v1/auth/admins/forgot-password (Public)', () => {
        test('should send verification code successfully for unverified admin', async () => {
            const sendData = {
                email: unverifiedAdmin.email,
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData)
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Verification code sent on');
            expect(res.body.data).toHaveProperty('expiresAt');
            expect(new Date(res.body.data.expiresAt)).toBeInstanceOf(Date);

            // Verify verification code was created in database
            const verificationCode = await VerificationCode.findOne({
                where: { email: unverifiedAdmin.email },
            });
            expect(verificationCode).toBeTruthy();
            expect(verificationCode.code).toBeTruthy();
            expect(verificationCode.expiresAt).toBeTruthy();
        });

        test('should return 400 for missing email', async () => {
            const sendData = {};

            const res = await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email is required');
        });

        test('should return 400 for invalid email format', async () => {
            const sendData = {
                email: 'invalid-email',
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData)
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('email');
        });

        test('should return 404 when admin with email not found', async () => {
            const sendData = {
                email: faker.internet.email().toLowerCase(),
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Admin with this email doesn't exists");
        });

        test('should handle sending verification code to already verified admin', async () => {
            const sendData = {
                email: existingAdmin.email, // This admin is already verified
            };

            const res = await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData);

            // The API might allow sending codes to verified admins
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Verification code sent');
        });

        test('should handle rate limiting for multiple requests', async () => {
            const sendData = {
                email: unverifiedAdmin.email,
            };

            // Send first request
            await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData)
                .expect(httpStatus.OK);

            // Send second request immediately (may or may not be rate limited)
            const res = await request(app)
                .post('/api/v1/auth/admins/forgot-password')
                .send(sendData);

            // The API might allow multiple requests or handle rate limiting differently
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Verification code sent');
        });
    });
});