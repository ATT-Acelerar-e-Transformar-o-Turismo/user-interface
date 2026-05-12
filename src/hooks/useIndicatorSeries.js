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

  const { startDate = null, endDate = null, limit = 2000, sort = 'asc', granularity = 'auto', aggregator = 'avg', enabled = true } = options;

  useEffect(() => {
    if (!indicatorId) {
      // No indicator selected — clear any stale series and stop the spinner.
      setSeries([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (!enabled) {
      // Idle: callers like IndicatorCard gate the fetch on in-view so the
      // domain page doesn't fire 12 parallel /series calls on mount. Loading
      // stays true so they show the spinner placeholder until in-view flips.
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const apiSeries = await dataService.getIndicatorSeries(indicatorId, {
          limit, sort, startDate, endDate, granularity, aggregator,
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
  }, [indicatorId, startDate, endDate, limit, sort, granularity, aggregator, enabled]);

  return { series, loading, error };
};

export default useIndicatorSeries;
