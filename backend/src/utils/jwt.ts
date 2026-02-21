import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/auth';

const secret = process.env.JWT_SECRET || 'change_me';
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (payload: AuthUser) => {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): AuthUser => {
  return jwt.verify(token, secret) as AuthUser;
};
