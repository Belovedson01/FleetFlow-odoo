import crypto from 'crypto';
import type { Request } from 'express';
import { Role, type User } from '@prisma/client';
import { prisma } from '../prisma/client';
import { sendEmail } from './email.service';
import type { AuthUser } from '../types/auth';
import { logAudit } from '../utils/audit';
import { ApiError } from '../utils/http';
import { signAccessToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

type PublicRegisterInput = {
  name: string;
  email: string;
  password: string;
};

type PrivilegedUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

const LOCKOUT_ATTEMPTS = Number(process.env.LOGIN_LOCKOUT_ATTEMPTS || 5);
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);

const authUserFromRecord = (user: { id: number; name: string; email: string; role: Role }): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const refreshTokenExpiryDate = () => {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const verificationTokenExpiryDate = () => {
  const hours = Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || 24);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

const lockUntilDate = () => new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);

const hashToken = (rawToken: string) => crypto.createHash('sha256').update(rawToken).digest('hex');
const generateSecureToken = () => crypto.randomBytes(48).toString('hex');

const sendAuthEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    await sendEmail({ to, subject, html });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Email delivery failed for subject "${subject}"`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw new ApiError(500, 'Email service temporarily unavailable');
  }
};

const issueEmailVerificationToken = async (userId: number, email: string) => {
  const rawToken = generateSecureToken();
  const emailVerificationTokenHash = hashToken(rawToken);
  const emailVerificationTokenExpiry = verificationTokenExpiryDate();

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash,
      emailVerificationTokenExpiry
    }
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyLink = `${frontendUrl}/verify-email?token=${rawToken}`;
  await sendAuthEmail({
    to: email,
    subject: 'Verify Your FleetFlow Account',
    html: `<p>Welcome to FleetFlow.</p><p>Please verify your account by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
  });
};

const issueRefreshToken = async (userId: number) => {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = refreshTokenExpiryDate();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return rawToken;
};

const revokeAllRefreshTokensForUser = async (userId: number) => {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revoked: false
    },
    data: {
      revoked: true
    }
  });
};

const incrementFailureAndLock = async (user: User) => {
  const nextAttempts = user.failedLoginAttempts + 1;
  const shouldLock = nextAttempts >= LOCKOUT_ATTEMPTS;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: shouldLock ? LOCKOUT_ATTEMPTS : nextAttempts,
      lockUntil: shouldLock ? lockUntilDate() : null
    }
  });
  return shouldLock;
};

export const registerUser = async (input: PublicRegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'Email already in use.');
  }

  const password = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { ...input, password, role: Role.DRIVER }
  });
  await issueEmailVerificationToken(user.id, user.email);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
};

export const createPrivilegedUser = async (input: PrivilegedUserInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'Email already in use.');
  }

  const password = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { ...input, password, emailVerifiedAt: new Date() }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
};

export const loginUser = async (email: string, password: string, req?: Request) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await logAudit({ action: 'auth.login.failed', req });
    throw new ApiError(401, 'Invalid credentials.');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    await logAudit({ userId: user.id, action: 'auth.login.locked', req });
    throw new ApiError(423, 'Account is locked. Please try again later.');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    const locked = await incrementFailureAndLock(user);
    await logAudit({
      userId: user.id,
      action: locked ? 'auth.login.locked' : 'auth.login.failed',
      req
    });
    if (locked) {
      throw new ApiError(423, `Account locked for ${LOCKOUT_MINUTES} minutes due to failed login attempts.`);
    }
    throw new ApiError(401, 'Invalid credentials.');
  }

  if (!user.emailVerifiedAt) {
    await logAudit({ userId: user.id, action: 'auth.login.unverified', req });
    throw new ApiError(403, 'Email not verified. Please verify your email before signing in.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockUntil: null
    }
  });

  const authUser = authUserFromRecord(user);
  const token = signAccessToken(authUser);
  const refreshToken = await issueRefreshToken(user.id);
  await logAudit({ userId: user.id, action: 'auth.login.success', req });

  return {
    token,
    refreshToken,
    user: authUser
  };
};

export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};

export const forgotPassword = async (email: string) => {
  const generic = { message: 'If this email exists, reset instructions have been sent.' };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return generic;
  }

  const rawToken = generateSecureToken();
  const resetTokenHash = hashToken(rawToken);
  const passwordResetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: resetTokenHash,
      passwordResetTokenExpiry
    }
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
  await sendAuthEmail({
    to: user.email,
    subject: 'FleetFlow Password Reset',
    html: `<p>Click below to reset your FleetFlow password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
  });

  return generic;
};

export const resendVerification = async (email: string) => {
  const generic = { message: 'If this email exists, verification instructions have been sent.' };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) {
    return generic;
  }

  await issueEmailVerificationToken(user.id, user.email);
  return generic;
};

export const verifyEmail = async (token: string, req?: Request) => {
  const emailVerificationTokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash,
      emailVerificationTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new ApiError(400, 'Verification token is invalid or expired.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiry: null
    }
  });
  await logAudit({ userId: user.id, action: 'auth.email.verified', req });

  return { message: 'Email verified successfully. You can now sign in.' };
};

export const resetPassword = async (token: string, password: string, req?: Request) => {
  const passwordResetTokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash,
      passwordResetTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new ApiError(400, 'Reset token is invalid or expired.');
  }

  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetTokenHash: null,
      passwordResetTokenExpiry: null
    }
  });
  await revokeAllRefreshTokensForUser(user.id);
  await logAudit({ userId: user.id, action: 'auth.password.reset', req });

  return { message: 'Password updated successfully.' };
};

export const refreshAccessToken = async (refreshToken: string, req?: Request) => {
  const incomingHash = hashToken(refreshToken);
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: incomingHash,
      revoked: false
    },
    include: {
      user: true
    }
  });

  if (!tokenRecord) {
    await logAudit({ action: 'auth.refresh.failed', req });
    throw new ApiError(401, 'Invalid refresh token.');
  }

  if (tokenRecord.expiresAt <= new Date()) {
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    });
    await logAudit({ userId: tokenRecord.userId, action: 'auth.refresh.failed', req });
    throw new ApiError(401, 'Refresh token expired or revoked.');
  }

  const nextRawToken = generateSecureToken();
  const nextTokenHash = hashToken(nextRawToken);
  const nextExpiresAt = refreshTokenExpiryDate();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    }),
    prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: nextTokenHash,
        expiresAt: nextExpiresAt
      }
    })
  ]);

  const authUser = authUserFromRecord(tokenRecord.user);
  const accessToken = signAccessToken(authUser);
  await logAudit({ userId: tokenRecord.userId, action: 'auth.refresh.rotated', req });

  return {
    token: accessToken,
    refreshToken: nextRawToken,
    user: authUser
  };
};

export const clearRefreshToken = async (refreshToken?: string | null, req?: Request) => {
  if (!refreshToken) {
    return {
      message: 'Logged out.'
    };
  }

  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    select: { id: true, userId: true, revoked: true }
  });

  if (tokenRecord && !tokenRecord.revoked) {
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    });
    await logAudit({ userId: tokenRecord.userId, action: 'auth.logout', req });
  }

  return {
    message: 'Logged out.'
  };
};
