import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

const categoryService = {
  getAll: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE);
    return data;
  },

  getByType: async (type) => {
    const { data } = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_TYPE(type));
    return data;
  },

  create: async (categoryData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.CATEGORIES.BASE, categoryData);
    return data;
  },

  update: async (id, categoryData) => {
    const { data } = await apiClient.put(API_ENDPOINTS.CATEGORIES.BY_ID(id), categoryData);
    return data;
  },

  delete: async (id) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
    return data;
  },
};

export default categoryService;
