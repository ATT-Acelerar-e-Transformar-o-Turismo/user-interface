import apiClient from './apiClient';

export const indicatorService = {
  // Get all indicators with pagination
  async getAll(skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/indicators/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get indicators by domain with pagination
  async getByDomain(domainId, skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/indicators/domain/${domainId}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get indicators by subdomain with pagination
  async getBySubdomain(domainId, subdomainName, skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/indicators/domain/${domainId}/subdomain/${subdomainName}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get indicator by ID
  async getById(indicatorId) {
    const response = await apiClient.get(`/api/indicators/${indicatorId}`);
    return response.data;
  }
};

export default indicatorService;