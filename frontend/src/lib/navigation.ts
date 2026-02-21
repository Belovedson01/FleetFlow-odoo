import type { Role } from '../types';

export const defaultRouteByRole: Record<Role, string> = {
  MANAGER: '/dashboard/manager',
  DISPATCHER: '/dashboard/dispatcher',
  SAFETY: '/dashboard/safety',
  ANALYST: '/dashboard/finance'
};
