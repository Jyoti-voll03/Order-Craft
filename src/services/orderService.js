import api from './api';

export const orderService = {
  async getAll(params = {}) {
    const res = await api.get('/orders', { params });
    return res.data?.data || [];
  },

  async getById(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data?.data;
  },

  async create(orderData) {
    const payload = {
      ...orderData,
      orderId: orderData.orderId || orderData.id,
      expectedDeliveryDate:
        orderData.expectedDeliveryDate || orderData.expectedDelivery,
    };
    const res = await api.post('/orders', payload);
    return res.data?.data;
  },

  async update(id, updatedData) {
    const payload = {
      ...updatedData,
      expectedDeliveryDate:
        updatedData.expectedDeliveryDate || updatedData.expectedDelivery,
    };
    const res = await api.put(`/orders/${id}`, payload);
    return res.data?.data;
  },

  async remove(id) {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  },
};
