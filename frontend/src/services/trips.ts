import type { Trip, TripStatus } from '../types';
import { api } from './api';

type TripPayload = Omit<Trip, 'id' | 'createdAt' | 'vehicle' | 'driver'>;

export const tripService = {
  list: async () => {
    const { data } = await api.get<Trip[]>('/trips');
    return data;
  },
  create: async (payload: Partial<TripPayload>) => {
    const { data } = await api.post<Trip>('/trips', payload);
    return data;
  },
  update: async (id: number, payload: Partial<TripPayload>) => {
    const { data } = await api.put<Trip>(`/trips/${id}`, payload);
    return data;
  },
  transition: async (id: number, status: TripStatus, endOdometer?: number) => {
    const { data } = await api.patch<Trip>(`/trips/${id}/status`, { status, endOdometer });
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/trips/${id}`);
  }
};
