import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { resourceService } from '../services/resourceService';

const WrapperContext = createContext();

export const useWrapper = () => {
  const context = useContext(WrapperContext);
  if (!context) {
    throw new Error('useWrapper must be used within a WrapperProvider');
  }
  return context;
};

export const WrapperProvider = ({ children }) => {
  const [wrappers, setWrappers] = useState({});
  const [pollingIntervals, setPollingIntervals] = useState({});
  const intervalsRef = useRef({});

  const uploadFile = useCallback(async (file) => {
    try {
      const response = await resourceService.uploadFile(file);
      return response;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }, []);

  const generateWrapper = useCallback(async (wrapperRequest) => {
    try {
      const wrapper = await resourceService.generateWrapper(wrapperRequest);
      setWrappers(prev => ({
        ...prev,
        [wrapper.wrapper_id]: wrapper
      }));
      return wrapper;
    } catch (error) {
      console.error('Wrapper generation failed:', error);
      throw error;
    }
  }, []);

  const getWrapperStatus = useCallback(async (wrapperId) => {
    try {
      const wrapper = await resourceService.getWrapper(wrapperId);
      setWrappers(prev => ({
        ...prev,
        [wrapperId]: wrapper
      }));
      return wrapper;
    } catch (error) {
      console.error('Failed to get wrapper status:', error);
      throw error;
    }
  }, []);

  const startPolling = useCallback((wrapperId, interval = 2000, onStatusChange) => {
    if (intervalsRef.current[wrapperId]) {
      return;
    }

    const pollStatus = async () => {
      try {
        const wrapper = await getWrapperStatus(wrapperId);

        if (onStatusChange) {
          onStatusChange(wrapper);
        }

        if (wrapper.status === 'completed' || wrapper.status === 'error') {
          stopPolling(wrapperId);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, interval);
    intervalsRef.current[wrapperId] = intervalId;

    setPollingIntervals(prev => ({
      ...prev,
      [wrapperId]: intervalId
    }));
  }, [getWrapperStatus]);

  const stopPolling = useCallback((wrapperId) => {
    if (intervalsRef.current[wrapperId]) {
      clearInterval(intervalsRef.current[wrapperId]);
      delete intervalsRef.current[wrapperId];

      setPollingIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[wrapperId];
        return newIntervals;
      });
    }
  }, []);

  const executeWrapper = useCallback(async (wrapperId) => {
    try {
      const result = await resourceService.executeWrapper(wrapperId);
      await getWrapperStatus(wrapperId);
      return result;
    } catch (error) {
      console.error('Wrapper execution failed:', error);
      throw error;
    }
  }, [getWrapperStatus]);

  const listWrappers = useCallback(async (skip = 0, limit = 10) => {
    try {
      const wrappersList = await resourceService.listWrappers(skip, limit);
      const wrappersMap = {};
      wrappersList.forEach(wrapper => {
        wrappersMap[wrapper.wrapper_id] = wrapper;
      });
      setWrappers(prev => ({ ...prev, ...wrappersMap }));
      return wrappersList;
    } catch (error) {
      console.error('Failed to list wrappers:', error);
      throw error;
    }
  }, []);

  const value = {
    wrappers,
    uploadFile,
    generateWrapper,
    getWrapperStatus,
    startPolling,
    stopPolling,
    executeWrapper,
    listWrappers,
    isPolling: (wrapperId) => !!intervalsRef.current[wrapperId],
  };

  return (
    <WrapperContext.Provider value={value}>
      {children}
    </WrapperContext.Provider>
  );
};

export default WrapperContext;
