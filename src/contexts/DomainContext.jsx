import { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import domainService from '../services/domainService';

const DomainContext = createContext();

const domainReducer = (state, action) => {
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
        domains: action.payload,
        error: null
      };
    case 'LOAD_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'ADD_DOMAIN':
      return {
        ...state,
        domains: [...state.domains, action.payload],
        error: null
      };
    case 'UPDATE_DOMAIN':
      return {
        ...state,
        domains: state.domains.map(domain =>
          domain.id === action.payload.id ? action.payload : domain
        ),
        error: null
      };
    case 'DELETE_DOMAIN':
      return {
        ...state,
        domains: state.domains.filter(domain => domain.id !== action.payload),
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
  domains: [],
  loading: true,
  error: null
};

export function DomainProvider({ children }) {
  const [state, dispatch] = useReducer(domainReducer, initialState);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      dispatch({ type: 'LOAD_START' });

      const response = await domainService.getAll();
      const domainsData = response || [];

      const transformedDomains = domainsData.map(domain => ({
        ...domain,
        DomainPage: domain.name ? `/${domain.name.toLowerCase()}` : '/unknown-domain',
        DomainColor: domain.color,
        DomainImage: domain.image,
        DomainIcon: domain.icon,
        DomainCarouselImages: [domain.image],
        subdomains: domain.subdomains ? domain.subdomains.filter(subdomain => subdomain != null).map(subdomain => ({ name: subdomain })) : []
      }));

      dispatch({ type: 'LOAD_SUCCESS', payload: transformedDomains });
    } catch (err) {
      dispatch({ type: 'LOAD_FAILURE', payload: err.message });
      console.error('Failed to load domains:', err);
    }
  };

  const refreshDomains = async () => {
    await loadDomains();
  };

  const addDomain = async (domain) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newDomain = await domainService.create(domain);
      dispatch({ type: 'ADD_DOMAIN', payload: newDomain });
      return newDomain;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to add domain:', err);
      throw err;
    }
  };

  const updateDomain = async (id, updatedDomain) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const updated = await domainService.update(id, updatedDomain);
      dispatch({ type: 'UPDATE_DOMAIN', payload: updated });
      return updated;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to update domain:', err);
      throw err;
    }
  };

  const deleteDomain = async (id) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await domainService.delete(id);
      dispatch({ type: 'DELETE_DOMAIN', payload: id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to delete domain:', err);
      throw err;
    }
  };

  const getDomainByName = (name) => {
    return state.domains.find(domain =>
      domain?.name === name
    ) || null;
  };

  const getDomainById = (id) => {
    return state.domains.find(domain => domain.id === id) || null;
  };

  return (
    <DomainContext.Provider value={{
      domains: state.domains,
      loading: state.loading,
      error: state.error,
      refreshDomains,
      addDomain,
      updateDomain,
      deleteDomain,
      getDomainByName,
      getDomainById
    }}>
      {children}
    </DomainContext.Provider>
  );
}

DomainProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useDomain() {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}
