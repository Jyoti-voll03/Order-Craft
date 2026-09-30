import api from './api';

export const inventoryService = {
  async getAll(params = {}) {
    const res = await api.get('/inventory', { params });
    return res.data?.data || [];
  },

  async getById(id) {
    const res = await api.get(`/inventory/${id}`);
    return res.data?.data;
  },

  async create(itemData) {
    const payload = {
      ...itemData,
      itemId: itemData.itemId || itemData.id,
      itemName: itemData.itemName || itemData.name,
      quantity: itemData.quantity ?? itemData.availableQuantity ?? 0,
      minimumStock: itemData.minimumStock ?? itemData.minStockLevel ?? 10,
    };
    const res = await api.post('/inventory', payload);
    return res.data?.data;
  },

  async update(id, updatedData) {
    const res = await api.put(`/inventory/${id}`, updatedData);
    return res.data?.data;
  },

  async remove(id) {
    const res = await api.delete(`/inventory/${id}`);
    return res.data;
  },
};
