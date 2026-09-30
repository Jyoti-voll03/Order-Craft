import api from './api';

export const customerService = {
  async getAll(params = {}) {
    const res = await api.get('/customers', { params });
    return res.data?.data || [];
  },

  async getById(id) {
    const res = await api.get(`/customers/${id}`);
    return res.data?.data;
  },

  async getOrders(id) {
    const res = await api.get(`/customers/${id}/orders`);
    return res.data?.data || [];
  },

  async create(customerData) {
    const payload = {
      ...customerData,
      customerId: customerData.customerId || customerData.id,
      customerName: customerData.customerName || customerData.name,
      companyName: customerData.companyName || customerData.company,
    };
    const res = await api.post('/customers', payload);
    return res.data?.data;
  },

  async update(id, updatedData) {
    const payload = {
      ...updatedData,
      customerName: updatedData.customerName || updatedData.name,
      companyName: updatedData.companyName || updatedData.company,
    };
    const res = await api.put(`/customers/${id}`, payload);
    return res.data?.data;
  },

  async remove(id) {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
};
