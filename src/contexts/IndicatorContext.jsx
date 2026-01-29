import { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import indicatorService from '../services/indicatorService';

const IndicatorContext = createContext();

const indicatorReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        indicators: action.payload,
        error: null
      };
    case 'LOAD_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'CREATE_INDICATOR':
      return {
        ...state,
        indicators: [...state.indicators, action.payload],
        error: null
      };
    case 'UPDATE_INDICATOR':
      return {
        ...state,
        indicators: state.indicators.map(indicator =>
          indicator.id === action.payload.id ? action.payload : indicator
        ),
        error: null
      };
    case 'PATCH_INDICATOR':
      return {
        ...state,
        indicators: state.indicators.map(indicator =>
          indicator.id === action.payload.id ? { ...indicator, ...action.payload.updates } : indicator
        ),
        error: null
      };
    case 'DELETE_INDICATOR':
      return {
        ...state,
        indicators: state.indicators.filter(indicator => indicator.id !== action.payload),
        error: null
      };
    case 'ADD_RESOURCE_TO_INDICATOR':
      return {
        ...state,
        indicators: state.indicators.map(indicator =>
          indicator.id === action.payload.indicatorId
            ? { ...indicator, resources: [...(indicator.resources || []), action.payload.resourceId] }
            : indicator
        ),
        error: null
      };
    case 'REMOVE_RESOURCE_FROM_INDICATOR':
      return {
        ...state,
        indicators: state.indicators.map(indicator =>
          indicator.id === action.payload.indicatorId
            ? { ...indicator, resources: (indicator.resources || []).filter(id => id !== action.payload.resourceId) }
            : indicator
        ),
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

const initialState = {
  indicators: [],
  loading: true,
  error: null
};

export function IndicatorProvider({ children }) {
  const [state, dispatch] = useReducer(indicatorReducer, initialState);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      dispatch({ type: 'LOAD_START' });
      const data = await indicatorService.getAll(0, 50);

      if (!Array.isArray(data)) {
        console.error("API returned non-array data:", data);
        dispatch({ type: 'LOAD_FAILURE', payload: "Invalid data format received from API" });
        return;
      }

      const normalizedIndicators = data.map(indicator => ({
        ...indicator,
        domain: typeof indicator.domain === 'object'
          ? (indicator.domain.id || indicator.domain._id || indicator.domain)
          : indicator.domain
      }));

      dispatch({ type: 'LOAD_SUCCESS', payload: normalizedIndicators || [] });
    } catch (err) {
      dispatch({ type: 'LOAD_FAILURE', payload: err.message });
      console.error('Failed to load indicators:', err);
    }
  };

  const createIndicator = async (domainId, subdomainName, indicatorData) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newIndicator = await indicatorService.create(domainId, subdomainName, indicatorData);
      dispatch({ type: 'CREATE_INDICATOR', payload: newIndicator });
      return newIndicator;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to create indicator:', err);
      throw err;
    }
  };

  const updateIndicator = async (indicatorId, indicatorData) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const updatedIndicator = await indicatorService.update(indicatorId, indicatorData);
      dispatch({ type: 'UPDATE_INDICATOR', payload: updatedIndicator });
      return updatedIndicator;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to update indicator:', err);
      throw err;
    }
  };

  const patchIndicator = async (indicatorId, updates) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'PATCH_INDICATOR', payload: { id: indicatorId, updates } });
      return state.indicators.find(indicator => indicator.id === indicatorId);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to patch indicator:', err);
      throw err;
    }
  };

  const deleteIndicator = async (indicatorId) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await indicatorService.delete(indicatorId);
      dispatch({ type: 'DELETE_INDICATOR', payload: indicatorId });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to delete indicator:', err);
      throw err;
    }
  };

  const getIndicatorById = (indicatorId) => {
    return state.indicators.find(indicator => indicator.id === indicatorId) || null;
  };

  const getIndicatorsByDomain = async (domainId) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const data = await indicatorService.getByDomain(domainId);
      return data || [];
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to get indicators by domain:', err);
      throw err;
    }
  };

  const getIndicatorsBySubdomain = async (domainId, subdomainName) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const data = await indicatorService.getBySubdomain(domainId, subdomainName);
      return data || [];
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to get indicators by subdomain:', err);
      throw err;
    }
  };

  const addResourceToIndicator = async (indicatorId, resourceId) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await indicatorService.addResource(indicatorId, resourceId);
      dispatch({ type: 'ADD_RESOURCE_TO_INDICATOR', payload: { indicatorId, resourceId } });
      return state.indicators.find(indicator => indicator.id === indicatorId);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to add resource to indicator:', err);
      throw err;
    }
  };

  const removeResourceFromIndicator = async (indicatorId, resourceId) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await indicatorService.removeResource(indicatorId, resourceId);
      dispatch({ type: 'REMOVE_RESOURCE_FROM_INDICATOR', payload: { indicatorId, resourceId } });
      return state.indicators.find(indicator => indicator.id === indicatorId);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to remove resource from indicator:', err);
      throw err;
    }
  };

  const refreshIndicators = () => {
    loadIndicators();
  };

  return (
    <IndicatorContext.Provider value={{
      indicators: state.indicators,
      loading: state.loading,
      error: state.error,
      createIndicator,
      updateIndicator,
      patchIndicator,
      deleteIndicator,
      getIndicatorById,
      getIndicatorsByDomain,
      getIndicatorsBySubdomain,
      addResourceToIndicator,
      removeResourceFromIndicator,
      refreshIndicators
    }}>
      {children}
    </IndicatorContext.Provider>
  );
}

IndicatorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useIndicator() {
  const context = useContext(IndicatorContext);
  if (!context) {
    throw new Error('useIndicator must be used within an IndicatorProvider');
  }
  return context;
}
