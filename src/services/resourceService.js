import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import { APP_CONFIG } from '../constants/app';

export const resourceService = {
  async getAll(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE) {
    const response = await apiClient.get(`${API_ENDPOINTS.RESOURCES.BASE}/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getById(resourceId) {
    const response = await apiClient.get(API_ENDPOINTS.RESOURCES.BY_ID(resourceId));
    return response.data;
  },

  async create(resourceData) {
    const response = await apiClient.post(`${API_ENDPOINTS.RESOURCES.BASE}/`, resourceData);
    return response.data;
  },

  async update(resourceId, resourceData) {
    const response = await apiClient.put(API_ENDPOINTS.RESOURCES.BY_ID(resourceId), resourceData);
    return response.data;
  },

  async patch(resourceId, resourceData) {
    const response = await apiClient.patch(API_ENDPOINTS.RESOURCES.BY_ID(resourceId), resourceData);
    return response.data;
  },

  async delete(resourceId) {
    const response = await apiClient.delete(API_ENDPOINTS.RESOURCES.BY_ID(resourceId));
    return response.data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/resources/wrappers/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async generateWrapper(wrapperRequest) {
    const response = await apiClient.post('/api/resources/wrappers/generate', wrapperRequest);
    return response.data;
  },

  async getWrapper(wrapperId) {
    const response = await apiClient.get(`/api/resources/wrappers/${wrapperId}`);
    return response.data;
  },

  async executeWrapper(wrapperId) {
    const response = await apiClient.post(`/api/resources/wrappers/${wrapperId}/execute`);
    return response.data;
  },

  async listWrappers(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE) {
    const response = await apiClient.get(`/api/resources/wrappers?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getWrapperLogs(wrapperId, limit = 200) {
    const response = await apiClient.get(`/api/resources/wrappers/${wrapperId}/logs?limit=${limit}`);
    return response.data;
  }
};

export default resourceService; 