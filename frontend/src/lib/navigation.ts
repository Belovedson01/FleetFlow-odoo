import type { Role } from '../types';

export const defaultRouteByRole: Record<Role, string> = {
  MANAGER: '/dashboard',
  DISPATCHER: '/trips',
  SAFETY: '/drivers',
  ANALYST: '/analytics'
};
