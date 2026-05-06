import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export const dataService = {
  async getIndicatorData(indicatorId, skip = 0, limit = 100, sort = 'asc', granularity = '0', startDate = null, endDate = null) {
    try {
      let url = `/api/indicators/${indicatorId}/data?skip=${skip}&limit=${limit}&sort=${sort}&granularity=${granularity}`;
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching indicator data:', error);
      return [];
    }
  },

  // One timeseries per resource attached to the indicator. Each entry feeds a
  // separate line on the chart; names come from the resource (fetched
  // separately) since the indicator-service doesn't keep them.
  async getIndicatorSeries(indicatorId, { skip = 0, limit = 1000, sort = 'asc', startDate = null, endDate = null } = {}) {
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: String(limit), sort });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const url = `${API_ENDPOINTS.INDICATORS.SERIES(indicatorId)}?${params.toString()}`;
      const response = await apiClient.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching indicator series:', error);
      return [];
    }
  },

  async getIndicatorDataByDate(indicatorId, startDate = null, endDate = null, limit = 100) {
    try {
      let url = `/api/indicators/${indicatorId}/data/by-date?limit=${limit}`;
      if (startDate) {
        url += `&start_date=${startDate.toISOString()}`;
      }
      if (endDate) {
        url += `&end_date=${endDate.toISOString()}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching indicator data by date:', error);
      return [];
    }
  },

  transformDataForChart(data, indicatorName = 'Data') {
    if (!data || !Array.isArray(data)) {
      return {
        series: [{
          name: indicatorName,
          data: []
        }]
      };
    }

    const transformedData = data.map(point => {
      let dateStr = point.x;
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
        dateStr += 'Z';
      }
      
      const timestamp = new Date(dateStr).getTime();
      
      if (isNaN(timestamp)) {
        console.warn('Invalid date encountered:', point.x);
        return null;
      }

      return {
        x: timestamp,
        y: Number(point.y.toFixed(2))
      };
    }).filter(p => p !== null);

    return {
      series: [{
        name: indicatorName,
        data: transformedData
      }]
    };
  }
};

export default dataService; 