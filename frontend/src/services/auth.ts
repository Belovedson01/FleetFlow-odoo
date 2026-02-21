import { api } from './api';
import type { User } from '../types';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<User>('/auth/register', payload);
    return data;
  },
  forgotPassword: async (email: string) => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },
  resendVerification: async (email: string) => {
    const { data } = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return data;
  },
  verifyEmail: async (token: string) => {
    const { data } = await api.post<{ message: string }>('/auth/verify-email', { token });
    return data;
  },
  resetPassword: async (token: string, password: string) => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return data;
  },
  refresh: async () => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/refresh');
    return data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  createPrivilegedUser: async (payload: RegisterPayload & { role: 'MANAGER' | 'SAFETY' | 'ANALYST' | 'DISPATCHER' }) => {
    const { data } = await api.post<User>('/auth/admin/users', payload);
    return data;
  },
  me: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  }
};
