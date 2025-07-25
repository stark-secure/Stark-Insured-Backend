import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

describe('LP Token Events (e2e)', () => {
  let app: INestApplication;
  let jwt: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login a user to get JWT and userId
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'Password123!' });
    userId = res.body.id;
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });
    jwt = loginRes.body.access_token;
  });

  afterAll(async () => {
    await getConnection().close();
    await app.close();
  });

  it('should emit and store mint and burn events, and retrieve them with filters', async () => {
    // Mint LP tokens
    const mintRes = await request(app.getHttpServer())
      .post('/lp-token/mint')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ amount: 100, poolId: 1 });
    expect(mintRes.status).toBe(201);
    const tokenId = mintRes.body.tokenId;

    // Burn some tokens
    const burnRes = await request(app.getHttpServer())
      .post('/lp-token/burn')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ tokenId, amount: 50 });
    expect(burnRes.status).toBe(200);

    // Get all events
    const eventsRes = await request(app.getHttpServer())
      .get('/lp-token/events')
      .set('Authorization', `Bearer ${jwt}`);
    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.data.length).toBeGreaterThanOrEqual(2);
    expect(eventsRes.body.data.some(e => e.eventType === 'mint')).toBe(true);
    expect(eventsRes.body.data.some(e => e.eventType === 'burn')).toBe(true);

    // Filter by eventType
    const mintEvents = await request(app.getHttpServer())
      .get('/lp-token/events?eventType=mint')
      .set('Authorization', `Bearer ${jwt}`);
    expect(mintEvents.body.data.every(e => e.eventType === 'mint')).toBe(true);

    // Filter by userAddress
    const userEvents = await request(app.getHttpServer())
      .get(`/lp-token/events?userAddress=${userId}`)
      .set('Authorization', `Bearer ${jwt}`);
    expect(userEvents.body.data.every(e => e.userAddress === userId)).toBe(true);

    // Pagination
    const paged = await request(app.getHttpServer())
      .get('/lp-token/events?page=1&limit=1')
      .set('Authorization', `Bearer ${jwt}`);
    expect(paged.body.data.length).toBe(1);
    expect(paged.body.page).toBe(1);
    expect(paged.body.limit).toBe(1);
  });
}); 