import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import resourceService from '../services/resourceService';
import indicatorService from '../services/indicatorService';

export const useIndicatorData = (indicatorId, indicatorName = 'Data', includeResources = true) => {
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
        
        let allSeries = [];
        
        // Add indicator data if available
        if (apiData && apiData.length > 0) {
          const chartData = dataService.transformDataForChart(apiData, indicatorName);
          allSeries.push(...chartData.series);
        }
        
        // If includeResources is true, fetch and merge resource data
        if (includeResources) {
          try {
            // Get indicator details to access resources
            const indicator = await indicatorService.getById(indicatorId);
            
            if (indicator && indicator.resources && indicator.resources.length > 0) {
              // Fetch data for each resource
              const resourceDataPromises = indicator.resources.map(async (resourceId) => {
                try {
                  const resourceInfo = await resourceService.getById(resourceId);
                  const resourceData = await resourceService.getResourceData(resourceId, 0, 1000, 'asc');
                  
                  if (resourceData && resourceData.length > 0) {
                    const transformedData = resourceData.map(point => ({
                      x: new Date(point.x).getTime(),
                      y: Number(point.y.toFixed(2))
                    }));
                    
                    return {
                      name: resourceInfo?.name || `Resource ${resourceId}`,
                      data: transformedData
                    };
                  }
                } catch (err) {
                  console.warn(`Failed to fetch data for resource ${resourceId}:`, err);
                }
                return null;
              });
              
              const resourceSeries = await Promise.all(resourceDataPromises);
              const validResourceSeries = resourceSeries.filter(series => series !== null);
              
              allSeries.push(...validResourceSeries);
            }
          } catch (err) {
            console.warn('Failed to fetch resource data:', err);
            // Continue with indicator data only
          }
        }
        
        if (allSeries.length > 0) {
          setData({ series: allSeries });
        } else {
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
  }, [indicatorId, indicatorName, includeResources]);

  return { data, loading, error };
};

export default useIndicatorData; 