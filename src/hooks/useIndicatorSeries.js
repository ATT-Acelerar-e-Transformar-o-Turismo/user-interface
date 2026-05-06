import { useState, useEffect } from 'react';
import dataService from '../services/dataService';

// Fetches the per-resource series for an indicator. Each entry is one line on
// the chart. Resource names are NOT included — the caller joins them from the
// resources it loaded separately (resource-service owns names; indicator-
// service only stores resource_id on data segments).
export const useIndicatorSeries = (indicatorId, options = {}) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { startDate = null, endDate = null, limit = 10000, sort = 'asc' } = options;

  useEffect(() => {
    if (!indicatorId) {
      setSeries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const apiSeries = await dataService.getIndicatorSeries(indicatorId, {
          limit, sort, startDate, endDate,
        });
        if (cancelled) return;
        setSeries(Array.isArray(apiSeries) ? apiSeries : []);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching indicator series:', err);
        setError(err.message);
        setSeries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [indicatorId, startDate, endDate, limit, sort]);

  return { series, loading, error };
};

export default useIndicatorSeries;
