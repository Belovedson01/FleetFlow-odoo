import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import type { User } from '../types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const refreshClient = axios.create({
  baseURL,
  withCredentials: true
});

export const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as { _retry?: boolean; headers?: Record<string, string> };
    const status = error?.response?.status as number | undefined;
    const authState = useAuthStore.getState();

    if (status === 401 && !originalRequest?._retry && authState.user) {
      originalRequest._retry = true;
      try {
        const { data } = await refreshClient.post<{ token: string; user: User }>('/auth/refresh');
        if (data?.token && data?.user) {
          useAuthStore.getState().setAuth(data.token, data.user);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
