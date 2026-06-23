import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import { APP_CONFIG } from '../constants/app';

// Wrapper lifecycle endpoints do real server-side work (Gemini generation,
// source fetches, subprocess management) and far outlast the shared client's
// 10s default. Status/log polling can also hit a busy resource-service, so give
// those a roomier-than-default budget too.
const WRAPPER_OP_TIMEOUT = 120000;   // generate / regenerate / execute
const WRAPPER_POLL_TIMEOUT = 30000;  // status + logs polling

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
    // Wrapper generation runs Gemini + an initial fetch server-side and routinely
    // takes far longer than the shared client's 10s default.
    const response = await apiClient.post('/api/resources/wrappers/generate', wrapperRequest, { timeout: WRAPPER_OP_TIMEOUT });
    return response.data;
  },

  async getWrapper(wrapperId) {
    const response = await apiClient.get(`/api/resources/wrappers/${wrapperId}`, { timeout: WRAPPER_POLL_TIMEOUT });
    return response.data;
  },

  async executeWrapper(wrapperId) {
    const response = await apiClient.post(`/api/resources/wrappers/${wrapperId}/execute`, null, { timeout: WRAPPER_OP_TIMEOUT });
    return response.data;
  },

  async regenerateWrapper(wrapperId) {
    // Regeneration re-runs generation server-side; the default 10s timeout aborts
    // it in the browser even though the backend keeps working, spamming errors.
    const response = await apiClient.post(`/api/resources/wrappers/${wrapperId}/regenerate`, null, { timeout: WRAPPER_OP_TIMEOUT });
    return response.data;
  },

  async listWrappers(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE) {
    const response = await apiClient.get(`/api/resources/wrappers?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getWrapperLogs(wrapperId, limit = 200) {
    const response = await apiClient.get(`/api/resources/wrappers/${wrapperId}/logs?limit=${limit}`, { timeout: WRAPPER_POLL_TIMEOUT });
    return response.data;
  },

  async getResourceData(resourceId, limit = 500) {
    const response = await apiClient.get(`/api/resources/${resourceId}/data?limit=${limit}`);
    return response.data;
  },

  async getFileInfo(fileId) {
    const response = await apiClient.get(`/api/resources/wrappers/files/${fileId}`);
    return response.data;
  }
};

export default resourceService; 