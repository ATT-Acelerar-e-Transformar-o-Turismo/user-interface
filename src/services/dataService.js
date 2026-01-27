import apiClient from './apiClient';

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