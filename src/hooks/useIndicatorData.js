import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

export const useIndicatorData = (indicatorId, indicatorName = 'Data', options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { granularity = '0', startDate = null, endDate = null, limit = 1000 } = options;

  useEffect(() => {
    const fetchData = async () => {
      if (!indicatorId) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch real data from API with dynamic options
        const apiData = await dataService.getIndicatorData(indicatorId, 0, limit, 'desc', granularity, startDate, endDate);
        
        if (apiData && apiData.length > 0) {
          // Transform real data for chart
          const chartData = dataService.transformDataForChart(apiData, indicatorName);
          setData(chartData);
        } else {
          // No data available
          // console.log(`No data available for indicator ${indicatorId}`);
          setData(null);
        }
      } catch (err) {
        console.error('Error fetching indicator data:', err);
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [indicatorId, indicatorName, granularity, startDate, endDate, limit]);

  return { data, loading, error };
};

export default useIndicatorData; 