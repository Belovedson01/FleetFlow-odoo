import type { Driver } from '../types';
import { api } from './api';

type DriverPayload = Omit<Driver, 'id' | 'createdAt'>;

export const driverService = {
  list: async () => {
    const { data } = await api.get<Driver[]>('/drivers');
    return data;
  },
  available: async () => {
    const { data } = await api.get<Driver[]>('/drivers/available');
    return data;
  },
  create: async (payload: DriverPayload) => {
    const { data } = await api.post<Driver>('/drivers', payload);
    return data;
  },
  update: async (id: number, payload: Partial<DriverPayload>) => {
    const { data } = await api.put<Driver>(`/drivers/${id}`, payload);
    return data;
  },
  updateCompliance: async (
    id: number,
    payload: Partial<Pick<DriverPayload, 'licenseExpiry' | 'status' | 'safetyScore'>>
  ) => {
    const { data } = await api.patch<Driver>(`/drivers/${id}/compliance`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/drivers/${id}`);
  }
};
