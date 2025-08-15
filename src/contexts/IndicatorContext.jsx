import { createContext, useContext, useState, useEffect } from 'react';
import indicatorService from '../services/indicatorService';
import PropTypes from 'prop-types';

const IndicatorContext = createContext();

export function IndicatorProvider({ children }) {
    const [indicators, setIndicators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadIndicators();
    }, []);

    const loadIndicators = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await indicatorService.getAll(0, 50);
            
            // Ensure data is an array before setting indicators
            if (!Array.isArray(data)) {
                console.error("API returned non-array data:", data);
                setIndicators([]);
                setError("Invalid data format received from API");
                return;
            }
            
            // Normalize indicators to ensure consistent domain ID format
            const normalizedIndicators = data.map(indicator => ({
                ...indicator,
                // Ensure domain is always a string ID, never an object
                domain: typeof indicator.domain === 'object' 
                    ? (indicator.domain.id || indicator.domain._id || indicator.domain)
                    : indicator.domain
            }));
            
            setIndicators(normalizedIndicators || []);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load indicators:', err);
        } finally {
            setLoading(false);
        }
    };

    const createIndicator = async (domainId, subdomainName, indicatorData) => {
        try {
            setError(null);
            // For now, we'll add to local state since the service doesn't have create method
            const newIndicator = {
                id: Date.now().toString(),
                domain: domainId,
                subdomain: subdomainName,
                ...indicatorData
            };
            setIndicators(prev => [...prev, newIndicator]);
            return newIndicator;
        } catch (err) {
            setError(err.message);
            console.error('Failed to create indicator:', err);
            throw err;
        }
    };

    const updateIndicator = async (indicatorId, indicatorData) => {
        try {
            setError(null);
            // For now, we'll update local state since the service doesn't have update method
            const updatedIndicator = { ...indicatorData, id: indicatorId };
            setIndicators(prev => 
                prev.map(indicator => 
                    indicator.id === indicatorId ? updatedIndicator : indicator
                )
            );
            return updatedIndicator;
        } catch (err) {
            setError(err.message);
            console.error('Failed to update indicator:', err);
            throw err;
        }
    };

    const patchIndicator = async (indicatorId, updates) => {
        try {
            setError(null);
            setIndicators(prev => 
                prev.map(indicator => 
                    indicator.id === indicatorId ? { ...indicator, ...updates } : indicator
                )
            );
            return indicators.find(indicator => indicator.id === indicatorId);
        } catch (err) {
            setError(err.message);
            console.error('Failed to patch indicator:', err);
            throw err;
        }
    };

    const deleteIndicator = async (indicatorId) => {
        try {
            setError(null);
            setIndicators(prev => prev.filter(indicator => indicator.id !== indicatorId));
        } catch (err) {
            setError(err.message);
            console.error('Failed to delete indicator:', err);
            throw err;
        }
    };

    const getIndicatorById = (indicatorId) => {
        return indicators.find(indicator => indicator.id === indicatorId) || null;
    };

    const getIndicatorsByDomain = async (domainId) => {
        try {
            setError(null);
            const data = await indicatorService.getByDomain(domainId);
            return data || [];
        } catch (err) {
            setError(err.message);
            console.error('Failed to get indicators by domain:', err);
            throw err;
        }
    };

    const getIndicatorsBySubdomain = async (domainId, subdomainName) => {
        try {
            setError(null);
            const data = await indicatorService.getBySubdomain(domainId, subdomainName);
            return data || [];
        } catch (err) {
            setError(err.message);
            console.error('Failed to get indicators by subdomain:', err);
            throw err;
        }
    };

    const addResourceToIndicator = async (indicatorId, resourceId) => {
        try {
            setError(null);
            setIndicators(prev => 
                prev.map(indicator => 
                    indicator.id === indicatorId 
                        ? { ...indicator, resources: [...(indicator.resources || []), resourceId] }
                        : indicator
                )
            );
            return indicators.find(indicator => indicator.id === indicatorId);
        } catch (err) {
            setError(err.message);
            console.error('Failed to add resource to indicator:', err);
            throw err;
        }
    };

    const removeResourceFromIndicator = async (indicatorId, resourceId) => {
        try {
            setError(null);
            setIndicators(prev => 
                prev.map(indicator => 
                    indicator.id === indicatorId 
                        ? { ...indicator, resources: (indicator.resources || []).filter(id => id !== resourceId) }
                        : indicator
                )
            );
            return indicators.find(indicator => indicator.id === indicatorId);
        } catch (err) {
            setError(err.message);
            console.error('Failed to remove resource from indicator:', err);
            throw err;
        }
    };

    const refreshIndicators = () => {
        loadIndicators();
    };

    return (
        <IndicatorContext.Provider value={{
            indicators,
            loading,
            error,
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

