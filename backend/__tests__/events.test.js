import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../src/config/db.js';

describe('Events & Nested Resources API Integration Tests', () => {
  let token = '';
  let eventId = '';
  let subEventId = '';
  let taskId = '';
  let vendorId = '';

  beforeAll(async () => {
    await connectDB();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Event CRUD Tester',
        email: `events_test_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('POST /api/v1/events — should create an event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tech Gala 2026',
        type: 'corporate',
        startDate: '2026-12-10T00:00:00.000Z',
        endDate: '2026-12-12T00:00:00.000Z',
        budget: { total: 2000000, currency: 'INR' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('Tech Gala 2026');
    eventId = res.body.data._id;
  });

  it('GET /api/v1/events — should list user events', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/v1/events/:eventId/sub-events — should create a sub-event', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/sub-events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Opening Keynote',
        date: '2026-12-10T00:00:00.000Z',
        startTime: '09:30',
        endTime: '12:30',
        expectedGuests: 300,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Opening Keynote');
    subEventId = res.body.data._id;
  });

  it('POST /api/v1/events/:eventId/vendors — should create a vendor', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/vendors`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Metro Audio Visuals',
        category: 'entertainment',
        status: 'shortlisted',
        contact: { name: 'Rajesh', phone: '+919876543210' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Metro Audio Visuals');
    vendorId = res.body.data._id;
  });

  it('POST /api/v1/events/:eventId/tasks — should create a task', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Stage & Mic Soundcheck',
        category: 'entertainment',
        subEvent: subEventId,
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    taskId = res.body.data._id;
  });

  it('PATCH /api/v1/events/:eventId/tasks/:id — should update task status', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('done');
  });

  it('POST /api/v1/events/:eventId/guest-groups — should create a guest group', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/guest-groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        label: 'VIP Delegates',
        count: 50,
        needsTransport: true,
        needsAccommodation: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/events/:eventId/requirements — should create a requirement', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/requirements`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'vehicle_capacity',
        required: 50,
        provided: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
