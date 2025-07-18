import apiClient from './apiClient';

export const domainService = {
  // Get all domains
  async getAll() {
    const response = await apiClient.get('/api/domains');
    return response.data;
  },

  // Get domain by ID
  async getById(domainId) {
    const response = await apiClient.get(`/api/domains/${domainId}`);
    return response.data;
  },

  // Create domain
  async create(domainData) {
    const response = await apiClient.post('/api/domains', domainData);
    return response.data;
  },

  // Update domain
  async update(domainId, domainData) {
    const response = await apiClient.put(`/api/domains/${domainId}`, domainData);
    return response.data;
  },

  // Patch domain (partial update)
  async patch(domainId, domainData) {
    const response = await apiClient.patch(`/api/domains/${domainId}`, domainData);
    return response.data;
  },

  // Delete domain
  async delete(domainId) {
    const response = await apiClient.delete(`/api/domains/${domainId}`);
    return response.data;
  }
};

export default domainService; 