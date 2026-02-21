import request from 'supertest';
import { Role } from '@prisma/client';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import app from '../app';
import { prisma } from '../prisma/client';
import { hashPassword } from '../utils/password';

const createdUserIds: number[] = [];

const createUser = async ({
  verified = true,
  password = 'Password@123'
}: {
  verified?: boolean;
  password?: string;
}) => {
  const now = Date.now();
  const email = `auth.test.${now}.${Math.floor(Math.random() * 100000)}@fleetflow.test`;
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: 'Auth Test User',
      email,
      password: hashed,
      role: Role.DRIVER,
      emailVerifiedAt: verified ? new Date() : null
    }
  });
  createdUserIds.push(user.id);
  return user;
};

afterEach(async () => {
  if (!createdUserIds.length) {
    return;
  }
  await prisma.refreshToken.deleteMany({
    where: {
      userId: {
        in: createdUserIds
      }
    }
  });
  await prisma.auditLog.deleteMany({
    where: {
      userId: {
        in: createdUserIds
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: createdUserIds
      }
    }
  });
  createdUserIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('auth flows', () => {
  it('blocks login for unverified accounts', async () => {
    const user = await createUser({ verified: false });

    const response = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'Password@123'
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Email not verified');
  });

  it('locks account after 5 failed attempts', async () => {
    const user = await createUser({ verified: true });

    for (let i = 0; i < 4; i += 1) {
      const response = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'WrongPassword@1'
      });
      expect(response.status).toBe(401);
    }

    const fifth = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'WrongPassword@1'
    });
    expect(fifth.status).toBe(423);

    const locked = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'Password@123'
    });
    expect(locked.status).toBe(423);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser?.lockUntil).toBeTruthy();
  });

  it('refresh endpoint rotates token and returns new access token', async () => {
    const user = await createUser({ verified: true });
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({
      email: user.email,
      password: 'Password@123'
    });

    const response = await agent.post('/api/auth/refresh').send({});
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe(user.email);

    const activeTokens = await prisma.refreshToken.count({
      where: { userId: user.id, revoked: false }
    });
    const revokedTokens = await prisma.refreshToken.count({
      where: { userId: user.id, revoked: true }
    });

    expect(activeTokens).toBe(1);
    expect(revokedTokens).toBeGreaterThanOrEqual(1);
  });

  it('logout revokes refresh token', async () => {
    const user = await createUser({ verified: true });
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({
      email: user.email,
      password: 'Password@123'
    });

    const before = await prisma.refreshToken.count({
      where: { userId: user.id, revoked: false }
    });
    expect(before).toBe(1);

    const logout = await agent.post('/api/auth/logout').send({});
    expect(logout.status).toBe(200);

    const after = await prisma.refreshToken.count({
      where: { userId: user.id, revoked: false }
    });
    expect(after).toBe(0);

    const refresh = await agent.post('/api/auth/refresh').send({});
    expect(refresh.status).toBe(401);
  });
});
