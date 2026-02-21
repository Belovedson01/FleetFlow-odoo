import type { AnalyticsResponse, DashboardResponse } from '../types';
import { api } from './api';

export const analyticsService = {
  dashboard: async () => {
    const { data } = await api.get<DashboardResponse>('/analytics/dashboard');
    return data;
  },
  reports: async () => {
    const { data } = await api.get<AnalyticsResponse>('/analytics/reports');
    return data;
  },
  exportCsv: async () => {
    const { data } = await api.get<Blob>('/analytics/reports/export/csv', {
      responseType: 'blob'
    });
    return data;
  },
  exportPdf: async () => {
    const { data } = await api.get<Blob>('/analytics/reports/export/pdf', {
      responseType: 'blob'
    });
    return data;
  }
};
