import { prisma } from '../prisma/client';
import { ApiError } from '../utils/http';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import type { Role } from '@prisma/client';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export const registerUser = async (input: RegisterInput) => {
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

  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
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

export const forgotPassword = async (_email: string) => {
  return {
    message: 'If this email exists, reset instructions have been sent.'
  };
};
