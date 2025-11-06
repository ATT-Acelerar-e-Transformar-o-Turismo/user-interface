import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

export const useIndicatorData = (indicatorId, indicatorName = 'Data') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Fetch real data from API
        const apiData = await dataService.getIndicatorData(indicatorId, 0, 50, 'desc');
        
        if (apiData && apiData.length > 0) {
          // Transform real data for chart
          const chartData = dataService.transformDataForChart(apiData, indicatorName);
          setData(chartData);
        } else {
          // No data available
          console.log(`No data available for indicator ${indicatorId}`);
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
  }, [indicatorId, indicatorName]);

  return { data, loading, error };
};

export default useIndicatorData; 