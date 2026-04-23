import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import { APP_CONFIG } from '../constants/app';

export const indicatorService = {
  async getAll(skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null, includeHidden = false) {
    let url = `${API_ENDPOINTS.INDICATORS.BASE}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    if (includeHidden) {
      url += `&include_hidden=true`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCount(includeHidden = false) {
    let url = API_ENDPOINTS.INDICATORS.COUNT;
    if (includeHidden) {
      url += `?include_hidden=true`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCountByArea(areaId, governanceFilter = null, includeHidden = false) {
    let url = API_ENDPOINTS.INDICATORS.COUNT_BY_AREA(areaId);
    const params = [];
    if (governanceFilter !== null) {
      params.push(`governance_filter=${governanceFilter}`);
    }
    if (includeHidden) {
      params.push(`include_hidden=true`);
    }
    if (params.length) url += `?${params.join('&')}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCountByDimension(areaId, dimensionName, governanceFilter = null, includeHidden = false) {
    let url = API_ENDPOINTS.INDICATORS.COUNT_BY_SUBDOMAIN(areaId, dimensionName);
    const params = [];
    if (governanceFilter !== null) {
      params.push(`governance_filter=${governanceFilter}`);
    }
    if (includeHidden) {
      params.push(`include_hidden=true`);
    }
    if (params.length) url += `?${params.join('&')}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  async search(query, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, skip = 0, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null, areaFilter = null, dimensionFilter = null, includeHidden = false) {
    if (!query || query.trim().length < APP_CONFIG.MIN_SEARCH_QUERY_LENGTH) {
      return [];
    }
    let url = `${API_ENDPOINTS.INDICATORS.SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skip}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    // Backend expects domain_filter / subdomain_filter even though the UI
    // exposes these as areaFilter / dimensionFilter.
    if (areaFilter !== null) {
      url += `&domain_filter=${encodeURIComponent(areaFilter)}`;
    }
    if (dimensionFilter !== null) {
      url += `&subdomain_filter=${encodeURIComponent(dimensionFilter)}`;
    }
    if (includeHidden) {
      url += `&include_hidden=true`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getByArea(areaId, skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null, includeHidden = false) {
    let url = `${API_ENDPOINTS.INDICATORS.BY_AREA(areaId)}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    if (includeHidden) {
      url += `&include_hidden=true`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getByDimension(areaId, dimensionName, skip = 0, limit = APP_CONFIG.DEFAULT_ITEMS_PER_PAGE, sortBy = APP_CONFIG.DEFAULT_SORT_BY, sortOrder = APP_CONFIG.DEFAULT_SORT_ORDER, governanceFilter = null, includeHidden = false) {
    let url = `${API_ENDPOINTS.INDICATORS.BY_SUBDOMAIN(areaId, dimensionName)}/?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (governanceFilter !== null) {
      url += `&governance_filter=${governanceFilter}`;
    }
    if (includeHidden) {
      url += `&include_hidden=true`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async getById(indicatorId) {
    const response = await apiClient.get(API_ENDPOINTS.INDICATORS.BY_ID(indicatorId));
    return response.data;
  },

  async create(areaId, dimensionName, indicatorData) {
    const response = await apiClient.post(API_ENDPOINTS.INDICATORS.CREATE(areaId, dimensionName), indicatorData);
    return response.data;
  },

  async update(indicatorId, indicatorData) {
    const response = await apiClient.put(API_ENDPOINTS.INDICATORS.BY_ID(indicatorId), indicatorData);
    return response.data;
  },

  async patch(indicatorId, data) {
    const response = await apiClient.patch(API_ENDPOINTS.INDICATORS.BY_ID(indicatorId), data);
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