import express from 'express';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool, query } from '@gym/shared/database/index.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { setEmailProvider } from '@gym/shared/utils/email.js';
import authRoutes from '../src/routes/auth.routes.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js';
import clientRoutes from '../../client-service/src/routes/client.routes.js';
import membershipRoutes from '../../membership-service/src/routes/membership.routes.js';
import paymentRoutes from '../../payment-service/src/routes/payment.routes.js';
import { createGatewayApp, type ServiceConfig } from '../../api-gateway/src/index.js';

const authApp = createServiceApp('/api/auth', authRoutes);
const clientApp = createServiceApp('/api/clients', clientRoutes);
const membershipApp = createServiceApp('/api/memberships', membershipRoutes);
const paymentApp = createServiceApp('/api/payments', paymentRoutes);
let gatewayApp: express.Express;
const serviceServers: Server[] = [];

let adminToken: string;
let fixtureClient: { id: number };
let fixtureMembership: { id: number };
let resetEmailText = '';

function createServiceApp(prefix: string, routes: express.Router) {
  const app = express();
  app.use(express.json());
  app.get('/health', async (_req, res) => {
    try {
      await query('SELECT 1');
      res.json({ status: 'healthy' });
    } catch {
      res.status(503).json({ status: 'unhealthy' });
    }
  });
  app.use(prefix, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

async function listen(app: express.Express) {
  const server = app.listen(0, '127.0.0.1');
  serviceServers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test service did not bind a TCP port');
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server: Server) {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

function bearer(token = adminToken) {
  return { Authorization: `Bearer ${token}` };
}

function uniqueEmail() {
  return `integration-${crypto.randomUUID()}@example.test`;
}

function uniqueDni() {
  return String(10_000_000 + Math.floor(Math.random() * 89_999_999));
}

async function createClient() {
  const response = await request(clientApp)
    .post('/api/clients')
    .set(bearer())
    .send({
      dni: uniqueDni(),
      firstName: 'Integration',
      lastName: 'Member',
      email: uniqueEmail(),
    })
    .expect(201);
  return response.body as { id: number; dni: string; firstName: string };
}

async function createAccount(firstName = 'Integration') {
  const email = uniqueEmail();
  const response = await request(authApp)
    .post('/api/auth/register')
    .send({ email, password: 'SecurePass123!', firstName, lastName: 'Member' })
    .expect(201);
  return { email, user: response.body.user, tokens: response.body.tokens };
}

beforeAll(async () => {
  await connectRedis();
  setEmailProvider({
    async sendEmail(_to, _subject, _html, text = '') {
      resetEmailText = text;
    },
  });

  const login = await request(authApp)
    .post('/api/auth/login')
    .send({ email: 'admin@mundofitness.com', password: 'Admin1234!' })
    .expect(200);
  adminToken = login.body.tokens.accessToken;

  fixtureClient = await createClient();
  const plan = await request(membershipApp)
    .post('/api/memberships/plans')
    .set(bearer())
    .send({ name: `Integration ${crypto.randomUUID()}`, durationDays: 30, price: 10.5, currency: 'PEN' })
    .expect(201);
  const membership = await request(membershipApp)
    .post('/api/memberships')
    .set(bearer())
    .send({ clientId: fixtureClient.id, planId: plan.body.id, autoRenew: false })
    .expect(201);
  fixtureMembership = { id: membership.body.id };

  const [authUrl, clientUrl, membershipUrl, paymentUrl] = await Promise.all([
    listen(authApp), listen(clientApp), listen(membershipApp), listen(paymentApp),
  ]);
  const services: ServiceConfig[] = [
    { name: 'auth-service', url: authUrl, paths: ['/api/auth'], publicPaths: ['/register', '/login', '/refresh', '/forgot-password', '/reset-password'] },
    { name: 'client-service', url: clientUrl, paths: ['/api/clients'] },
    { name: 'membership-service', url: membershipUrl, paths: ['/api/memberships'] },
    { name: 'payment-service', url: paymentUrl, paths: ['/api/payments'] },
  ];
  gatewayApp = createGatewayApp(services);
}, 120000);

afterAll(async () => {
  await Promise.all(serviceServers.map(closeServer));
  setEmailProvider({ async sendEmail() {} });
  await disconnectRedis();
  await closePool();
}, 30000);

describe('Integration: Auth Service with PostgreSQL and Redis', () => {
  it('registers, signs in, and resolves the authenticated account', async () => {
    const account = await createAccount();
    const login = await request(authApp)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'SecurePass123!' })
      .expect(200);

    expect(login.body.user.id).toBe(account.user.id);
    await request(authApp)
      .get('/api/auth/me')
      .set(bearer(login.body.tokens.accessToken))
      .expect(200)
      .expect(({ body }) => expect(body.email).toBe(account.email));
    await request(authApp)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'wrong-password' })
      .expect(401);
  });

  it('rotates refresh tokens and rejects reuse', async () => {
    const account = await createAccount();
    const first = await request(authApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: account.tokens.refreshToken })
      .expect(200);

    expect(first.body.refreshToken).not.toBe(account.tokens.refreshToken);
    await request(authApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: account.tokens.refreshToken })
      .expect(401);
  });

  it('revokes the supplied refresh token on logout', async () => {
    const account = await createAccount();
    await request(authApp)
      .post('/api/auth/logout')
      .set(bearer(account.tokens.accessToken))
      .send({ refreshToken: account.tokens.refreshToken })
      .expect(204);
    await request(authApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: account.tokens.refreshToken })
      .expect(401);
  });

  it('resets a password from the email provider token and blocks token reuse', async () => {
    const account = await createAccount();
    resetEmailText = '';
    await request(authApp).post('/api/auth/forgot-password').send({ email: account.email }).expect(204);
    await request(authApp).post('/api/auth/forgot-password').send({ email: uniqueEmail() }).expect(204);

    const resetToken = resetEmailText.match(/token de recuperación es: ([a-f0-9]+)/i)?.[1];
    expect(resetToken).toBeTruthy();
    const reset = { token: resetToken, newPassword: 'ResetPass456!' };
    await request(authApp).post('/api/auth/reset-password').send(reset).expect(204);
    await request(authApp)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'ResetPass456!' })
      .expect(200);
    await request(authApp).post('/api/auth/reset-password').send(reset).expect(400);
  });

  it('requires a fresh login after changing the password', async () => {
    const account = await createAccount();
    await request(authApp)
      .post('/api/auth/change-password')
      .set(bearer(account.tokens.accessToken))
      .send({ currentPassword: 'SecurePass123!', newPassword: 'ChangedPass789!' })
      .expect(204);
    await request(authApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: account.tokens.refreshToken })
      .expect(401);
    await request(authApp)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'ChangedPass789!' })
      .expect(200);
  });
});

describe('Integration: Client Service with PostgreSQL and Redis', () => {
  it('creates, reads, updates, searches, and rejects a duplicate client', async () => {
    const client = await createClient();
    await request(clientApp)
      .get(`/api/clients/${client.id}`)
      .set(bearer())
      .expect(200)
      .expect(({ body }) => expect(body.dni).toBe(client.dni));
    await request(clientApp)
      .patch(`/api/clients/${client.id}`)
      .set(bearer())
      .send({ phone: '+51999999999' })
      .expect(200)
      .expect(({ body }) => expect(body.phone).toBe('+51999999999'));
    await request(clientApp)
      .get(`/api/clients?search=${client.dni}`)
      .set(bearer())
      .expect(200)
      .expect(({ body }) => expect(body.data.some((item: { id: number }) => item.id === client.id)).toBe(true));
    await request(clientApp)
      .post('/api/clients')
      .set(bearer())
      .send({ dni: client.dni, firstName: 'Duplicate', lastName: 'Member' })
      .expect(409);
  });

  it('enforces authentication and validates client input', async () => {
    await request(clientApp).get('/api/clients').expect(401);
    await request(clientApp)
      .post('/api/clients')
      .set(bearer())
      .send({ firstName: 'Incomplete' })
      .expect(400);
  });
});

describe('Integration: Membership Service with PostgreSQL and Redis', () => {
  it('persists plans and memberships, records a check-in, and checks out', async () => {
    const memberships = await request(membershipApp)
      .get(`/api/memberships/client/${fixtureClient.id}`)
      .set(bearer())
      .expect(200);
    expect(memberships.body.some((item: { id: number }) => item.id === fixtureMembership.id)).toBe(true);

    const visit = await request(membershipApp)
      .post('/api/memberships/visits/check-in')
      .set(bearer())
      .send({ clientId: fixtureClient.id, clientMembershipId: fixtureMembership.id })
      .expect(201);
    expect(String(visit.body.clientMembershipId)).toBe(String(fixtureMembership.id));

    await request(membershipApp)
      .post('/api/memberships/visits/check-in')
      .set(bearer())
      .send({ clientId: fixtureClient.id, clientMembershipId: fixtureMembership.id })
      .expect(409);
    await request(membershipApp)
      .post(`/api/memberships/visits/${visit.body.id}/check-out`)
      .set(bearer())
      .expect(200)
      .expect(({ body }) => expect(body.id).toBe(visit.body.id));
  });

  it('rejects check-in when the membership does not belong to the client', async () => {
    await request(membershipApp)
      .post('/api/memberships/visits/check-in')
      .set(bearer())
      .send({ clientId: fixtureClient.id + 1_000_000, clientMembershipId: fixtureMembership.id })
      .expect(400);
  });
});

describe('Integration: Payment Service with PostgreSQL and Redis', () => {
  it('records and retrieves a payment linked to the client membership', async () => {
    const transactionId = `integration-${crypto.randomUUID()}`;
    const created = await request(paymentApp)
      .post('/api/payments')
      .set(bearer())
      .send({
        clientId: fixtureClient.id,
        membershipId: fixtureMembership.id,
        amount: 25.5,
        currency: 'PEN',
        paymentMethod: 'cash',
        transactionId,
      })
      .expect(201);

    expect(created.body.status).toBe('completed');
    expect(created.body.transactionId).toBe(transactionId);
    await request(paymentApp)
      .get(`/api/payments/${created.body.id}`)
      .set(bearer())
      .expect(200)
      .expect(({ body }) => expect(String(body.membershipId)).toBe(String(fixtureMembership.id)));
    await request(paymentApp)
      .get(`/api/payments/transaction/${transactionId}`)
      .set(bearer())
      .expect(200)
      .expect(({ body }) => expect(body.id).toBe(created.body.id));
  });

  it('rejects invalid values and a membership owned by another client', async () => {
    const unrelatedClient = await createClient();
    await request(paymentApp)
      .post('/api/payments')
      .set(bearer())
      .send({ clientId: fixtureClient.id, membershipId: fixtureMembership.id, amount: -1, paymentMethod: 'cash' })
      .expect(400);
    await request(paymentApp)
      .post('/api/payments')
      .set(bearer())
      .send({
        clientId: unrelatedClient.id,
        membershipId: fixtureMembership.id,
        amount: 10,
        paymentMethod: 'cash',
      })
      .expect(400);
  });
});

describe('Integration: API Gateway with real service routers', () => {
  it('forwards login and a database-backed JSON request through the service proxy', async () => {
    const login = await request(gatewayApp)
      .post('/api/auth/login')
      .send({ email: 'admin@mundofitness.com', password: 'Admin1234!' })
      .expect(200);
    const token = login.body.tokens.accessToken as string;
    const client = await request(gatewayApp)
      .post('/api/clients')
      .set(bearer(token))
      .send({ dni: uniqueDni(), firstName: 'Gateway', lastName: 'Forwarded', email: uniqueEmail() })
      .expect(201);

    await request(gatewayApp)
      .get(`/api/clients/${client.body.id}`)
      .set(bearer(token))
      .expect(200)
      .expect(({ body }) => expect(body.firstName).toBe('Gateway'));
    await request(gatewayApp).get('/api/clients').expect(401);
  });

  it('checks downstream health and rejects unknown routes', async () => {
    const health = await request(gatewayApp).get('/health').expect(200);
    expect(health.body.status).toBe('healthy');
    expect(health.body.services).toHaveLength(4);
    await request(gatewayApp).get('/route-that-does-not-exist').expect(404);
  });
});
