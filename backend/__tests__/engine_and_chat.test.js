import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../src/config/db.js';

describe('Deterministic Engine & AI Chat Integration Tests', () => {
  let token = '';
  let eventId = '';

  beforeAll(async () => {
    await connectDB();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Engine Chat Tester',
        email: `engine_chat_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    token = res.body.data.accessToken;

    const eventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Summit & Gala 2026',
        type: 'corporate',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        budget: { total: 1000000, spent: 0, currency: 'INR' },
      });
    eventId = eventRes.body.data._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('POST /api/v1/events/:eventId/risks/scan — should run deterministic risk evaluation', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/risks/scan`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.detectedRisks).toBeDefined();
  });

  it('GET /api/v1/events/:eventId/readiness — should calculate event readiness score', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/readiness`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.score).toBe('number');
    expect(res.body.data.breakdown).toBeDefined();
  });

  it('POST /api/v1/events/:eventId/impact — should run cascading impact analysis', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/impact`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'guest_count_change',
        payload: { delta: 100 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.severity).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
  });

  it('POST /api/v1/events/:eventId/chat — should parse message and return proposed actions', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/chat`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'Sangeet ceremony scheduled, decor vendor pending',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toBeDefined();
    expect(Array.isArray(res.body.data.proposedActions)).toBe(true);

    if (res.body.data.proposedActions.length > 0) {
      const action = res.body.data.proposedActions[0];
      const confirmRes = await request(app)
        .post(`/api/v1/events/${eventId}/chat/actions/${action.actionId}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({ note: 'Confirmed in Jest test' });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
    }
  });

  it('POST /api/v1/events/:eventId/chat/what-if — should simulate scenario without modifying database', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/chat/what-if`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        scenario: 'What if catering vendor backs out 5 days prior?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.impactAnalysis).toBeDefined();
  });

  it('GET /api/v1/events/:eventId/dashboard — should retrieve consolidated dashboard', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/dashboard`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.readiness).toBeDefined();
    expect(res.body.data.topRisks).toBeDefined();
    expect(res.body.data.vendorSummary).toBeDefined();
  });
});
