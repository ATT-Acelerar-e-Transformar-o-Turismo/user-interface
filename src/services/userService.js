import apiClient from './apiClient';

export const userService = {
  async getAll(skip = 0, limit = 50) {
    const response = await apiClient.get(`/api/users/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getById(userId) {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await apiClient.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await apiClient.delete(`/api/users/${userId}`);
    return response.data;
  },

  async updateRole(userId, role) {
    const response = await apiClient.put(`/api/users/${userId}/role`, { role });
    return response.data;
  }
};

export default userService;