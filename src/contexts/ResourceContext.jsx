import { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import resourceService from '../services/resourceService';

const ResourceContext = createContext();

const resourceReducer = (state, action) => {
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
        resources: action.payload,
        error: null
      };
    case 'LOAD_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'ADD_RESOURCE':
      return {
        ...state,
        resources: [...state.resources, action.payload],
        error: null
      };
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map(resource =>
          resource.id === action.payload.id ? action.payload : resource
        ),
        error: null
      };
    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter(resource => resource.id !== action.payload),
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
  resources: [],
  loading: false,
  error: null
};

export function ResourceProvider({ children }) {
  const [state, dispatch] = useReducer(resourceReducer, initialState);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      dispatch({ type: 'LOAD_START' });
      const data = await resourceService.getAll(0, 50);
      dispatch({ type: 'LOAD_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'LOAD_FAILURE', payload: err.message });
      console.error('Failed to load resources:', err);
    }
  };

  const addResource = async (resource) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newResource = await resourceService.create(resource);
      dispatch({ type: 'ADD_RESOURCE', payload: newResource });
      return newResource;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to add resource:', err);
      throw err;
    }
  };

  const updateResource = async (id, updatedResource) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const updated = await resourceService.update(id, updatedResource);
      dispatch({ type: 'UPDATE_RESOURCE', payload: updated });
      return updated;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to update resource:', err);
      throw err;
    }
  };

  const deleteResource = async (id) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await resourceService.delete(id);
      dispatch({ type: 'DELETE_RESOURCE', payload: id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to delete resource:', err);
      throw err;
    }
  };

  const getResourceById = (id) => {
    return state.resources.find(resource => resource.id === id) || null;
  };

  const getResourcesByIndicator = (indicatorId) => {
    return state.resources.filter(resource => resource.indicator === indicatorId);
  };

  const refreshResources = () => {
    loadResources();
  };

  return (
    <ResourceContext.Provider value={{
      resources: state.resources,
      loading: state.loading,
      error: state.error,
      addResource,
      updateResource,
      deleteResource,
      getResourceById,
      getResourcesByIndicator,
      refreshResources
    }}>
      {children}
    </ResourceContext.Provider>
  );
}

ResourceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useResource() {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
}
