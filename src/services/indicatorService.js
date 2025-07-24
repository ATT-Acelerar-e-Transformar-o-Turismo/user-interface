import apiClient from './apiClient';

export const indicatorService = {
  async getAll(skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/indicators/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getByDomain(domainId, skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/indicators/domain/${domainId}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getBySubdomain(domainId, subdomainName, skip = 0, limit = 10) {
    const response = await apiClient.get(`/api/indicators/domain/${domainId}/subdomain/${subdomainName}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getById(indicatorId) {
    const response = await apiClient.get(`/api/indicators/${indicatorId}`);
    return response.data;
  }
};

export default indicatorService;