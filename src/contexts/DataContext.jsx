import React, { createContext, useContext, useState, useEffect } from 'react';
import dataService from '../services/dataService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [dataCache, setDataCache] = useState(new Map());
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [errorStates, setErrorStates] = useState(new Map());

  const fetchIndicatorData = async (indicatorId, indicatorName = 'Data') => {
    if (dataCache.has(indicatorId)) {
      return dataCache.get(indicatorId);
    }

    setLoadingStates(prev => new Map(prev).set(indicatorId, true));
    setErrorStates(prev => new Map(prev).set(indicatorId, null));

    try {
      const apiData = await dataService.getIndicatorData(indicatorId, 0, 10000, 'desc');
      
      if (apiData && apiData.length > 0) {
        const chartData = dataService.transformDataForChart(apiData, indicatorName);
        setDataCache(prev => new Map(prev).set(indicatorId, chartData));
        setLoadingStates(prev => new Map(prev).set(indicatorId, false));
        return chartData;
      } else {
        setDataCache(prev => new Map(prev).set(indicatorId, null));
        setLoadingStates(prev => new Map(prev).set(indicatorId, false));
        return null;
      }
    } catch (err) {
      console.error('Error fetching indicator data:', err);
      setErrorStates(prev => new Map(prev).set(indicatorId, err.message));
      setLoadingStates(prev => new Map(prev).set(indicatorId, false));
      return null;
    }
  };

  const getIndicatorData = (indicatorId) => {
    return dataCache.get(indicatorId) || null;
  };

  const isLoading = (indicatorId) => {
    return loadingStates.get(indicatorId) || false;
  };

  const getError = (indicatorId) => {
    return errorStates.get(indicatorId) || null;
  };

  const clearCache = () => {
    setDataCache(new Map());
    setLoadingStates(new Map());
    setErrorStates(new Map());
  };

  const value = {
    fetchIndicatorData,
    getIndicatorData,
    isLoading,
    getError,
    clearCache
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext; 