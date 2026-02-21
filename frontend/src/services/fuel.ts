import type { FuelLog } from '../types';
import { api } from './api';

type FuelPayload = Omit<FuelLog, 'id' | 'createdAt' | 'vehicle'>;

export const fuelService = {
  list: async (vehicleId?: number) => {
    const { data } = await api.get<FuelLog[]>('/fuel-logs', { params: { vehicleId } });
    return data;
  },
  create: async (payload: FuelPayload) => {
    const { data } = await api.post<FuelLog>('/fuel-logs', payload);
    return data;
  },
  update: async (id: number, payload: Partial<FuelPayload>) => {
    const { data } = await api.put<FuelLog>(`/fuel-logs/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/fuel-logs/${id}`);
  }
};
