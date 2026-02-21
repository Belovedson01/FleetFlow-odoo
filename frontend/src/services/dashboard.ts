import type {
  DispatcherDashboardResponse,
  FinanceDashboardResponse,
  ManagerDashboardResponse,
  SafetyDashboardResponse
} from '../types';
import { api } from './api';

export const dashboardService = {
  manager: async () => {
    const { data } = await api.get<ManagerDashboardResponse>('/dashboard/manager');
    return data;
  },
  dispatcher: async () => {
    const { data } = await api.get<DispatcherDashboardResponse>('/dashboard/dispatcher');
    return data;
  },
  safety: async () => {
    const { data } = await api.get<SafetyDashboardResponse>('/dashboard/safety');
    return data;
  },
  finance: async () => {
    const { data } = await api.get<FinanceDashboardResponse>('/dashboard/finance');
    return data;
  }
};
