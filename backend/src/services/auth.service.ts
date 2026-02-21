import crypto from 'crypto';
import { prisma } from '../prisma/client';
import type { AuthUser } from '../types/auth';
import { ApiError } from '../utils/http';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { Role } from '@prisma/client';

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

const hashToken = (rawToken: string) => crypto.createHash('sha256').update(rawToken).digest('hex');

export const registerUser = async (input: PublicRegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'Email already in use.');
  }

  const password = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { ...input, password, role: Role.DRIVER }
  });

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
    data: { ...input, password }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  const authUser = authUserFromRecord(user);
  const token = signAccessToken(authUser);
  const refreshToken = signRefreshToken(user.id);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = refreshTokenExpiryDate();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt
    }
  });

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

  const rawToken = crypto.randomBytes(32).toString('hex');
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
  // eslint-disable-next-line no-console
  console.log(`Password reset link for ${user.email}: ${resetLink}`);

  return generic;
};

export const resetPassword = async (token: string, password: string) => {
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
      passwordResetTokenExpiry: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null
    }
  });

  return { message: 'Password updated successfully.' };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const userId = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    throw new ApiError(401, 'Invalid refresh token.');
  }

  const incomingHash = hashToken(refreshToken);
  if (incomingHash !== user.refreshTokenHash || user.refreshTokenExpiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token expired or invalid.');
  }

  const nextRefreshToken = signRefreshToken(user.id);
  const nextRefreshHash = hashToken(nextRefreshToken);
  const nextRefreshExpiry = refreshTokenExpiryDate();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: nextRefreshHash,
      refreshTokenExpiresAt: nextRefreshExpiry
    }
  });

  const authUser = authUserFromRecord(user);
  const accessToken = signAccessToken(authUser);
  return {
    token: accessToken,
    refreshToken: nextRefreshToken,
    user: authUser
  };
};

export const clearRefreshToken = async (userId: number) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null
    }
  });

  return {
    message: 'Logged out.'
  };
};
