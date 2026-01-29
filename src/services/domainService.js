import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export const domainService = {
  async getAll() {
    const response = await apiClient.get(API_ENDPOINTS.DOMAINS.BASE);
    return response.data;
  },

  async getById(domainId) {
    const response = await apiClient.get(API_ENDPOINTS.DOMAINS.BY_ID(domainId));
    return response.data;
  },

  async create(domainData) {
    const response = await apiClient.post(`${API_ENDPOINTS.DOMAINS.BASE}/`, domainData);
    return response.data;
  },

  async update(domainId, domainData) {
    const response = await apiClient.put(API_ENDPOINTS.DOMAINS.BY_ID(domainId), domainData);
    return response.data;
  },

  async patch(domainId, domainData) {
    const response = await apiClient.patch(API_ENDPOINTS.DOMAINS.BY_ID(domainId), domainData);
    return response.data;
  },

  async delete(domainId) {
    const response = await apiClient.delete(API_ENDPOINTS.DOMAINS.BY_ID(domainId));
    return response.data;
  }
};

export default domainService; 