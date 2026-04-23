import { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import areaService from '../services/areaService';

const AreaContext = createContext();

const areaReducer = (state, action) => {
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
        areas: action.payload,
        error: null
      };
    case 'LOAD_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'ADD_AREA':
      return {
        ...state,
        areas: [...state.areas, action.payload],
        error: null
      };
    case 'UPDATE_AREA':
      return {
        ...state,
        areas: state.areas.map(area =>
          area.id === action.payload.id ? action.payload : area
        ),
        error: null
      };
    case 'DELETE_AREA':
      return {
        ...state,
        areas: state.areas.filter(area => area.id !== action.payload),
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
  areas: [],
  loading: true,
  error: null
};

export function AreaProvider({ children }) {
  const [state, dispatch] = useReducer(areaReducer, initialState);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      dispatch({ type: 'LOAD_START' });

      const response = await areaService.getAll();
      const areasData = Array.isArray(response) ? response : (response?.areas || response?.domains || []);

      const transformedAreas = areasData.map(area => {
        const subdomains = area.subdomains || area.subdominios || [];
        return {
          ...area,
          AreaPage: area.name ? `/${area.name.toLowerCase()}` : '/unknown-area',
          AreaColor: area.color || area.DomainColor,
          AreaImage: area.image || area.DomainImage,
          AreaIcon: area.icon || area.DomainIcon,
          AreaCarouselImages: area.AreaCarouselImages || area.DomainCarouselImages || [area.image || area.DomainImage],
          dimensions: subdomains.filter(subdomain => subdomain != null).map(subdomain => (
            typeof subdomain === 'object' && subdomain.name !== undefined
              ? subdomain
              : { name: subdomain }
          ))
        };
      });

      dispatch({ type: 'LOAD_SUCCESS', payload: transformedAreas });
    } catch (err) {
      dispatch({ type: 'LOAD_FAILURE', payload: err.message });
      console.error('Failed to load areas:', err);
    }
  };

  const refreshAreas = async () => {
    await loadAreas();
  };

  const addArea = async (area) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newArea = await areaService.create(area);
      dispatch({ type: 'ADD_AREA', payload: newArea });
      return newArea;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to add area:', err);
      throw err;
    }
  };

  const updateArea = async (id, updatedArea) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const updated = await areaService.update(id, updatedArea);
      dispatch({ type: 'UPDATE_AREA', payload: updated });
      return updated;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to update area:', err);
      throw err;
    }
  };

  const deleteArea = async (id) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await areaService.delete(id);
      dispatch({ type: 'DELETE_AREA', payload: id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to delete area:', err);
      throw err;
    }
  };

  const getAreaByName = (name) => {
    return state.areas.find(area =>
      area?.name === name
    ) || null;
  };

  const getAreaById = (id) => {
    return state.areas.find(area => area.id === id) || null;
  };

  return (
    <AreaContext.Provider value={{
      areas: state.areas,
      loading: state.loading,
      error: state.error,
      refreshAreas,
      addArea,
      updateArea,
      deleteArea,
      getAreaByName,
      getAreaById
    }}>
      {children}
    </AreaContext.Provider>
  );
}

AreaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useArea() {
  const context = useContext(AreaContext);
  if (!context) {
    throw new Error('useArea must be used within a AreaProvider');
  }
  return context;
}
