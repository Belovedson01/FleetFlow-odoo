import type { Vehicle } from '../types';
import { api } from './api';

type VehiclePayload = Omit<Vehicle, 'id' | 'createdAt'>;

export const vehicleService = {
  list: async () => {
    const { data } = await api.get<Vehicle[]>('/vehicles');
    return data;
  },
  available: async () => {
    const { data } = await api.get<Vehicle[]>('/vehicles/available');
    return data;
  },
  create: async (payload: VehiclePayload) => {
    const { data } = await api.post<Vehicle>('/vehicles', payload);
    return data;
  },
  update: async (id: number, payload: Partial<VehiclePayload>) => {
    const { data } = await api.put<Vehicle>(`/vehicles/${id}`, payload);
    return data;
  },
  retire: async (id: number) => {
    const { data } = await api.patch<Vehicle>(`/vehicles/${id}/retire`);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/vehicles/${id}`);
  }
};
