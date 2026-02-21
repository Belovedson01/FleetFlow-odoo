import type { Request } from 'express';
import { prisma } from '../prisma/client';

type LogAuditInput = {
  userId?: number | null;
  action: string;
  req?: Request;
};

const resolveIp = (req?: Request) => {
  if (!req) {
    return null;
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
};

const resolveUserAgent = (req?: Request) => {
  if (!req) {
    return null;
  }
  const userAgent = req.headers['user-agent'];
  return typeof userAgent === 'string' ? userAgent : null;
};

export const logAudit = async ({ userId, action, req }: LogAuditInput) => {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      ip: resolveIp(req),
      userAgent: resolveUserAgent(req)
    }
  });
};
