import type { ServiceLog } from '../types';
import { api } from './api';

type ServicePayload = Omit<ServiceLog, 'id' | 'createdAt' | 'vehicle'>;

export const maintenanceService = {
  list: async (vehicleId?: number) => {
    const { data } = await api.get<ServiceLog[]>('/service-logs', { params: { vehicleId } });
    return data;
  },
  create: async (payload: ServicePayload) => {
    const { data } = await api.post<ServiceLog>('/service-logs', payload);
    return data;
  },
  update: async (id: number, payload: Partial<ServicePayload>) => {
    const { data } = await api.put<ServiceLog>(`/service-logs/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/service-logs/${id}`);
  }
};
