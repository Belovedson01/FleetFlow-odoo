import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/auth';

type AccessTokenPayload = AuthUser & { tokenType: 'access' };
type RefreshTokenPayload = { sub: number; tokenType: 'refresh' };

const accessSecret = process.env.JWT_SECRET || 'change_me';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'change_me_refresh';
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

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

export const signRefreshToken = (userId: number) => {
  return jwt.sign({ sub: userId, tokenType: 'refresh' }, refreshSecret, {
    expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn']
  });
};

export const verifyRefreshToken = (token: string): number => {
  const decoded = jwt.verify(token, refreshSecret);
  if (typeof decoded === 'string' || decoded.tokenType !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  const payload = decoded as unknown as RefreshTokenPayload;
  return Number(payload.sub);
};
