import api from './api';

export const dashboardService = {
  async getStats() {
    const res = await api.get('/dashboard');
    return res.data?.data;
  },
};
