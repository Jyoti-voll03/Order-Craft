import api from './api';

export const productionService = {
  async getAll(params = {}) {
    const res = await api.get('/production', { params });
    return res.data?.data || [];
  },

  async getById(id) {
    const res = await api.get(`/production/${id}`);
    return res.data?.data;
  },

  async create(prodData) {
    const payload = {
      ...prodData,
      productionId: prodData.productionId || prodData.id,
      expectedCompletionDate:
        prodData.expectedCompletionDate || prodData.expectedCompletion,
    };
    const res = await api.post('/production', payload);
    return res.data?.data;
  },

  async update(id, updatedData) {
    const payload = {
      ...updatedData,
      expectedCompletionDate:
        updatedData.expectedCompletionDate || updatedData.expectedCompletion,
    };
    const res = await api.put(`/production/${id}`, payload);
    return res.data?.data;
  },

  async updateProgress(id, payload) {
    const res = await api.patch(`/production/${id}/progress`, payload);
    return res.data?.data;
  },

  async updateStatus(id, payload) {
    const res = await api.patch(`/production/${id}/status`, payload);
    return res.data?.data;
  },

  async remove(id) {
    const res = await api.delete(`/production/${id}`);
    return res.data;
  },
};
