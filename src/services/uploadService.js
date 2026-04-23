import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export const uploadService = {
  async uploadAreaIcon(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      API_ENDPOINTS.UPLOADS.AREA_ICONS,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.url || response.data.file_url || response.data;
  },

  async uploadAreaImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      API_ENDPOINTS.UPLOADS.AREA_IMAGES,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.url || response.data.file_url || response.data;
  }
};

export default uploadService;
