import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

// Backend stores/returns areas with `subdomains`. Throughout the UI we refer
// to the same concept as `dimensions`. Normalize once here so every consumer
// sees both shapes.
const normalizeArea = (area) => {
  if (!area || typeof area !== 'object') return area;
  const subdomains = area.subdomains || area.subdominios || area.dimensions || [];
  const dimensions = subdomains.map(s =>
    typeof s === 'object' && s !== null ? s : { name: s }
  );
  return { ...area, subdomains, dimensions };
};

export const areaService = {
  async getAll(includeHidden = false) {
    const url = includeHidden
      ? `${API_ENDPOINTS.AREAS.BASE}?include_hidden=true`
      : API_ENDPOINTS.AREAS.BASE;
    const response = await apiClient.get(url);
    const data = response.data;
    return Array.isArray(data) ? data.map(normalizeArea) : data;
  },

  async getById(areaId) {
    const response = await apiClient.get(API_ENDPOINTS.AREAS.BY_ID(areaId));
    return normalizeArea(response.data);
  },

  async create(areaData) {
    const response = await apiClient.post(`${API_ENDPOINTS.AREAS.BASE}/`, areaData);
    return response.data;
  },

  async update(areaId, areaData) {
    const response = await apiClient.put(API_ENDPOINTS.AREAS.BY_ID(areaId), areaData);
    return response.data;
  },

  async patch(areaId, areaData) {
    const response = await apiClient.patch(API_ENDPOINTS.AREAS.BY_ID(areaId), areaData);
    return response.data;
  },

  async delete(areaId) {
    const response = await apiClient.delete(API_ENDPOINTS.AREAS.BY_ID(areaId));
    return response.data;
  }
};

export default areaService; 