import type { Role } from '@prisma/client';

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
  name: string;
};
