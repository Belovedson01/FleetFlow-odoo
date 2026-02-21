import bcrypt from 'bcryptjs';

export const hashPassword = (rawPassword: string) => bcrypt.hash(rawPassword, 10);

export const comparePassword = (rawPassword: string, hashedPassword: string) =>
  bcrypt.compare(rawPassword, hashedPassword);
