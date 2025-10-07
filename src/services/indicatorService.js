import apiClient from './apiClient';

export const indicatorService = {
  async getAll(skip = 0, limit = 10, sortBy = 'name', sortOrder = 'asc', governanceFilter = null) {
    let url = `/api/indicators/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCount() {
    const response = await apiClient.get('/api/indicators/count');
    return response.data;
  },

  async getCountByDomain(domainId, governanceFilter = null) {
    let url = `/api/indicators/domain/${domainId}/count`;
    if (governanceFilter !== null) {
      url += `?governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCountBySubdomain(domainId, subdomainName, governanceFilter = null) {
    const encodedSubdomainName = encodeURIComponent(subdomainName);
    let url = `/api/indicators/domain/${domainId}/subdomain/${encodedSubdomainName}/count`;
    if (governanceFilter !== null) {
      url += `?governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async search(query, limit = 10, skip = 0, sortBy = 'name', sortOrder = 'asc', governanceFilter = null, domainFilter = null, subdomainFilter = null) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    let url = `/api/indicators/search?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skip}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    if (domainFilter !== null) {
      url += `&domain_filter=${encodeURIComponent(domainFilter)}`;
    }
    if (subdomainFilter !== null) {
      url += `&subdomain_filter=${encodeURIComponent(subdomainFilter)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getByDomain(domainId, skip = 0, limit = 10, sortBy = 'name', sortOrder = 'asc', governanceFilter = null) {
    let url = `/api/indicators/domain/${domainId}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getBySubdomain(domainId, subdomainName, skip = 0, limit = 10, sortBy = 'name', sortOrder = 'asc', governanceFilter = null) {
    const encodedSubdomainName = encodeURIComponent(subdomainName);
    let url = `/api/indicators/domain/${domainId}/subdomain/${encodedSubdomainName}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getById(indicatorId) {
    const response = await apiClient.get(`/api/indicators/${indicatorId}`);
    return response.data;
  },

  // Create indicator
  async create(domainId, subdomainName, indicatorData) {
    const encodedSubdomainName = encodeURIComponent(subdomainName);
    const response = await apiClient.post(`/api/indicators/${domainId}/${encodedSubdomainName}/`, indicatorData);
    return response.data;
  },

  // Update indicator (full update)
  async update(indicatorId, indicatorData) {
    const response = await apiClient.put(`/api/indicators/${indicatorId}`, indicatorData);
    return response.data;
  },

  // Patch indicator (partial update)
  async patch(indicatorId, indicatorData) {
    const response = await apiClient.patch(`/api/indicators/${indicatorId}`, indicatorData);
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