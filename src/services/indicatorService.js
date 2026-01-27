import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import { APP_CONFIG } from '../constants/app';

export const indicatorService = {
  async getAll(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null) {
    let url = `${API_ENDPOINTS.INDICATORS.BASE}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCount() {
    const response = await apiClient.get(API_ENDPOINTS.INDICATORS.COUNT);
    return response.data;
  },

  async getCountByDomain(domainId, governanceFilter = null) {
    let url = API_ENDPOINTS.INDICATORS.COUNT_BY_DOMAIN(domainId);
    if (governanceFilter !== null) {
      url += `?governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCountBySubdomain(domainId, subdomainName, governanceFilter = null) {
    let url = API_ENDPOINTS.INDICATORS.COUNT_BY_SUBDOMAIN(domainId, subdomainName);
    if (governanceFilter !== null) {
      url += `?governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async search(query, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, skip = 0, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null, domainFilter = null, subdomainFilter = null) {
    if (!query || query.trim().length < APP_CONFIG.MIN_SEARCH_QUERY_LENGTH) {
      return [];
    }
    let url = `${API_ENDPOINTS.INDICATORS.SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skip}&sort_by=${sortBy}&sort_order=${sortOrder}`;
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

  async getByDomain(domainId, skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null) {
    let url = `${API_ENDPOINTS.INDICATORS.BY_DOMAIN(domainId)}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getBySubdomain(domainId, subdomainName, skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null) {
    let url = `${API_ENDPOINTS.INDICATORS.BY_SUBDOMAIN(domainId, subdomainName)}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getById(indicatorId) {
    const response = await apiClient.get(API_ENDPOINTS.INDICATORS.BY_ID(indicatorId));
    return response.data;
  },

  async create(domainId, subdomainName, indicatorData) {
    const response = await apiClient.post(API_ENDPOINTS.INDICATORS.CREATE(domainId, subdomainName), indicatorData);
    return response.data;
  },

  async update(indicatorId, indicatorData) {
    const response = await apiClient.put(API_ENDPOINTS.INDICATORS.BY_ID(indicatorId), indicatorData);
    return response.data;
  },

  async delete(indicatorId) {
    const response = await apiClient.delete(API_ENDPOINTS.INDICATORS.BY_ID(indicatorId));
    return response.data;
  },

  async getResources(indicatorId) {
    const response = await apiClient.get(API_ENDPOINTS.INDICATORS.RESOURCES(indicatorId));
    return response.data;
  },

  async addResource(indicatorId, resourceId) {
    const response = await apiClient.post(API_ENDPOINTS.INDICATORS.RESOURCES(indicatorId), { resource_id: resourceId });
    return response.data;
  },

  async removeResource(indicatorId, resourceId) {
    const response = await apiClient.delete(API_ENDPOINTS.INDICATORS.RESOURCES_BY_ID(indicatorId, resourceId));
    return response.data;
  },

  async getData(indicatorId, startDate = null, endDate = null, limit = 100) {
    let url = `${API_ENDPOINTS.INDICATORS.DATA(indicatorId)}?limit=${limit}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    const response = await apiClient.get(url);
    return response.data;
  },

  async exportChartImage(indicatorId, exportConfig) {
    const response = await apiClient.post(API_ENDPOINTS.INDICATORS.EXPORT_IMAGE(indicatorId), exportConfig, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default indicatorService;