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
  },

  // Create indicator
  async create(domainId, subdomainName, indicatorData) {
    const response = await apiClient.post(`/api/indicators/${domainId}/${subdomainName}/`, indicatorData);
    return response.data;
  },

  // Update indicator
  async update(indicatorId, indicatorData) {
    const response = await apiClient.put(`/api/indicators/${indicatorId}`, indicatorData);
    return response.data;
  },

  // Delete indicator
  async delete(indicatorId) {
    const response = await apiClient.delete(`/api/indicators/${indicatorId}`);
    return response.data;
  },

  // Get resources for an indicator
  async getResources(indicatorId) {
    const response = await apiClient.get(`/api/indicators/${indicatorId}/resources`);
    return response.data;
  },

  // Add resource to indicator
  async addResource(indicatorId, resourceId) {
    const response = await apiClient.post(`/api/indicators/${indicatorId}/resources`, { resource_id: resourceId });
    return response.data;
  },

  // Remove resource from indicator
  async removeResource(indicatorId, resourceId) {
    const response = await apiClient.delete(`/api/indicators/${indicatorId}/resources/${resourceId}`);
    return response.data;
  },

  // Get data points for an indicator
  async getData(indicatorId, startDate = null, endDate = null, limit = 100) {
    let url = `/api/indicators/${indicatorId}/data/by-date?limit=${limit}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    
    const response = await apiClient.get(url);
    return response.data;
  }
};

export default indicatorService;