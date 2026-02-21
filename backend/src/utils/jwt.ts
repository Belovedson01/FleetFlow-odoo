import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/auth';

type AccessTokenPayload = AuthUser & { tokenType: 'access' };

const accessSecret = process.env.JWT_SECRET || 'change_me';
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

export const signAccessToken = (payload: AuthUser) => {
  return jwt.sign({ ...payload, tokenType: 'access' }, accessSecret, {
    expiresIn: accessExpiresIn as jwt.SignOptions['expiresIn']
  });
};

export const verifyAccessToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, accessSecret) as AccessTokenPayload;
  if (decoded.tokenType !== 'access') {
    throw new Error('Invalid access token type');
  }
  return {
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role
  };
};
