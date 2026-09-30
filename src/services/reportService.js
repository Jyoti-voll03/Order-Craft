import api from './api';

export const reportService = {
  async getReports(params = {}) {
    const res = await api.get('/reports', { params });
    return res.data?.data;
  },
};
