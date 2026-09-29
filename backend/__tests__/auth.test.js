import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../src/config/db.js';

describe('Auth API Integration Tests', () => {
  let testUserToken = '';
  let testRefreshTokenCookie = '';
  const testEmail = `auth_jest_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('POST /api/v1/auth/register — should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jest Test User',
        email: testEmail,
        password: testPassword,
        role: 'manager',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();

    testUserToken = res.body.data.accessToken;
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      testRefreshTokenCookie = cookies[0];
    }
  });

  it('POST /api/v1/auth/register — should reject duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate User',
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login — should authenticate with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    testUserToken = res.body.data.accessToken;
  });

  it('POST /api/v1/auth/login — should reject incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me — should fetch user profile with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('GET /api/v1/auth/me — should reject invalid token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/logout — should clear session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${testUserToken}`)
      .set('Cookie', testRefreshTokenCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
