import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Branch from '../../../db/models/branch.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Batch from '../../../db/models/batch.model.js';
import { faker } from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Batch API - updateBatch', () => {
    let adminToken;
    let branch;
    let university;
    let scheme;
    let semester;
    let division;
    let batch;

    beforeEach(async () => {
        // Create admin and login
        await Admin.create({
            email: 'admin4@example.com',
            username: 'adminuser4',
            password: 'Admin@12345',
        });
        const loginRes = await request(app)
            .post('/api/v1/auth/admins/login')
            .send({ emailOrUsername: 'admin4@example.com', password: 'Admin@12345' });
        adminToken = loginRes.body.data.accessToken;

        // Create dependencies and batch
        branch = await Branch.create({ name: 'ME', abbreviation: 'ME' });
        university = await University.create({ name: 'Test University', abbreviation: 'TU' });
        scheme = await Scheme.create({ name: 'ME 2025 Scheme', universityId: university.id });
        semester = await Semester.create({
            branchId: branch.id,
            semesterNumber: 4,
            academicStartYear: 2025,
            academicEndYear: 2026,
            startDate: '2025-08-01',
            endDate: '2025-12-15',
            schemeId: scheme.id,
        });
        division = await Division.create({ divisionCode: 'E', semesterId: semester.id });
        batch = await Batch.create({ batchCode: '2025-E', divisionId: division.id });
    });

    describe('PUT /api/v1/batches/:id', () => {
        test('should update batch when request is valid', async () => {
            const updatedCode = '2025-E1';
            const res = await request(app)
                .put(`/api/v1/batches/${batch.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ batchCode: updatedCode })
                .expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Batch updated successfully');
            expect(res.body.data).toHaveProperty('id', batch.id);
            expect(res.body.data).toHaveProperty('batchCode', updatedCode);

            // Verify in DB
            const dbBatch = await Batch.findByPk(batch.id);
            expect(dbBatch.batchCode).toBe(updatedCode);
        });

        test('should return 404 when batch not found', async () => {
            const fakeId = faker.string.uuid();
            const res = await request(app)
                .put(`/api/v1/batches/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ batchCode: '2025-X' })
                .expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Batch not found');
        });

        test('should return 400 for invalid id', async () => {
            const res = await request(app)
                .put('/api/v1/batches/invalid-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ batchCode: '2025-X' })
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Batch ID must be a valid UUID');
        });

        test('should return 400 when batchCode missing', async () => {
            const res = await request(app)
                .put(`/api/v1/batches/${batch.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Batch code is required');
        });

        test('should return 401 when no token', async () => {
            const res = await request(app)
                .put(`/api/v1/batches/${batch.id}`)
                .send({ batchCode: '2025-F' })
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when token invalid', async () => {
            const res = await request(app)
                .put(`/api/v1/batches/${batch.id}`)
                .set('Authorization', 'Bearer invalidtoken')
                .send({ batchCode: '2025-F' })
                .expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
