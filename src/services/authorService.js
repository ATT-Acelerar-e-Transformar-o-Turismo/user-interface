import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

const authorService = {
  getAll: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTHORS.BASE);
    return data;
  },

  getById: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTHORS.BY_ID(id));
    return data;
  },

  getBySlug: async (slug) => {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTHORS.BY_SLUG(slug));
    return data;
  },

  create: async (authorData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTHORS.BASE, authorData);
    return data;
  },

  update: async (id, authorData) => {
    const { data } = await apiClient.put(API_ENDPOINTS.AUTHORS.BY_ID(id), authorData);
    return data;
  },

  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(API_ENDPOINTS.AUTHORS.PHOTO(id), formData, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  },

  uploadCover: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(API_ENDPOINTS.AUTHORS.COVER(id), formData, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  },

  delete: async (id) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.AUTHORS.BY_ID(id));
    return data;
  },
};

export default authorService;
