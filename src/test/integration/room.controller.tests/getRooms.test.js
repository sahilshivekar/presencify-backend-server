import { jest } from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Room from '../../../db/models/room.model.js';

setupTestDb();

describe('Room Controller - getRooms', () => {
  let adminToken;

  beforeEach(async () => {
    await Admin.create({ email: 'admin@example.com', username: 'adminuser', password: 'Admin@12345' });
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/admins/login')
      .send({ emailOrUsername: 'admin@example.com', password: 'Admin@12345' });
    adminToken = adminLoginRes.body.data.accessToken;

    try {
      await Room.bulkCreate([
        { roomNumber: 'A101', sittingCapacity: 40 },
        { roomNumber: 'B202', sittingCapacity: 50 },
        { roomNumber: 'C303', sittingCapacity: 60 },
        { roomNumber: 'D404', sittingCapacity: 70 },
      ]);
    } catch (err) {
      console.error('Room.bulkCreate error:', err);
      throw err;
    }
  });

  const url = '/api/v1/rooms';

  test('should require authentication', async () => {
    const res = await request(app)
      .get(url);
    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
  });

  test('should get all rooms with getAll=true', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ getAll: true });
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data.totalCount).toBeGreaterThanOrEqual(4);
  });

  test('should paginate rooms', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 2 });
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms.length).toBe(2);
    expect(res.body.data.totalCount).toBeGreaterThanOrEqual(4);
  });

  test('should search rooms by roomNumber', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ searchQuery: 'A101' });
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms.length).toBe(1);
    expect(res.body.data.rooms[0].roomNumber).toBe('A101');
  });

  test('should sort rooms by sittingCapacity DESC', async () => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ sortBy: 'sittingCapacity', sortOrder: 'DESC', getAll: true });
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms[0].sittingCapacity).toBeGreaterThanOrEqual(res.body.data.rooms[1].sittingCapacity);
  });
});
