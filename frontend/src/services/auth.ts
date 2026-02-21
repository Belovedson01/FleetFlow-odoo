import { api } from './api';
import type { Role, User } from '../types';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: Role;
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
  me: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  }
};
