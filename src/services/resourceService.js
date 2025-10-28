import apiClient from './apiClient';

export const resourceService = {
  // Get all resources with pagination
  async getAll(skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/resources/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get resource by ID
  async getById(resourceId) {
    const response = await apiClient.get(`/api/resources/${resourceId}`);
    return response.data;
  },

  // Create resource
  async create(resourceData) {
    const response = await apiClient.post('/api/resources/', resourceData);
    return response.data;
  },

  // Update resource
  async update(resourceId, resourceData) {
    const response = await apiClient.put(`/api/resources/${resourceId}`, resourceData);
    return response.data;
  },

  // Patch resource (partial update)
  async patch(resourceId, resourceData) {
    const response = await apiClient.patch(`/api/resources/${resourceId}`, resourceData);
    return response.data;
  },

  // Delete resource
  async delete(resourceId) {
    const response = await apiClient.delete(`/api/resources/${resourceId}`);
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

  async getFileInfo(fileId) {
    const response = await apiClient.get(`/api/resources/wrappers/files/${fileId}`);
    return response.data;
  },

  async deleteFile(fileId) {
    const response = await apiClient.delete(`/api/resources/wrappers/files/${fileId}`);
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

  async listWrappers(skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/resources/wrappers/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async executeWrapper(wrapperId) {
    const response = await apiClient.post(`/api/resources/wrappers/${wrapperId}/execute`);
    return response.data;
  },
};

export default resourceService; 