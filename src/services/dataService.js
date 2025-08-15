import apiClient from './apiClient';

export const dataService = {
  async getIndicatorData(indicatorId, skip = 0, limit = 50, sort = 'asc') {
    try {
      const response = await apiClient.get(`/api/indicators/${indicatorId}/data?skip=${skip}&limit=${limit}&sort=${sort}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching indicator data:', error);
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

  // Transform API data to chart format
  transformDataForChart(data, indicatorName = 'Data') {
    if (!data || !Array.isArray(data)) {
      return {
        series: [{
          name: indicatorName,
          data: []
        }]
      };
    }

    const transformedData = data.map(point => ({
      x: new Date(point.x).getTime(), // Convert to timestamp
      y: Number(point.y.toFixed(2)) // Format to 2 decimal places
    }));

    return {
      series: [{
        name: indicatorName,
        data: transformedData
      }]
    };
  }
};

export default dataService; 