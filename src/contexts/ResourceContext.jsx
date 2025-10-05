import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import resourceService from '../services/resourceService';

const ResourceContext = createContext();

export function ResourceProvider({ children }) {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedResources = await resourceService.getAll(0, 50); // Max limit is 50
            setResources(fetchedResources);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load resources:', err);
            // Fallback to localStorage for backward compatibility
            try {
                const storedResources = JSON.parse(localStorage.getItem('resources')) || [];
                setResources(storedResources);
            } catch (localErr) {
                console.error('Failed to load from localStorage:', localErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const addResource = async (resource) => {
        try {
            setError(null);
            // Prepare resource data for API
            const resourceData = {
                wrapper_id: resource.wrapper_id || generateWrapperId(),
                name: resource.name,
                type: resource.type || 'file',
                ...resource
            };
            
            const newResource = await resourceService.create(resourceData);
            setResources(prev => [...prev, newResource]);
            return newResource;
        } catch (err) {
            setError(err.message);
            console.error('Failed to add resource:', err);
            throw err;
        }
    };

    const updateResource = async (id, updatedResource) => {
        try {
            setError(null);
            const updated = await resourceService.update(id, updatedResource);
            setResources(prev => prev.map(resource => 
                resource.id === id ? updated : resource
            ));
            return updated;
        } catch (err) {
            setError(err.message);
            console.error('Failed to update resource:', err);
            throw err;
        }
    };

    const deleteResource = async (id) => {
        try {
            setError(null);
            await resourceService.delete(id);
            setResources(prev => prev.filter(resource => resource.id !== id));
        } catch (err) {
            setError(err.message);
            console.error('Failed to delete resource:', err);
            throw err;
        }
    };

    const getResourceById = async (id) => {
        try {
            // Try to find in local state first
            const localResource = resources.find(resource => resource.id === id);
            if (localResource) {
                return localResource;
            }
            
            // If not found locally, fetch from API
            const resource = await resourceService.getById(id);
            return resource;
        } catch (err) {
            console.error('Failed to get resource by id:', err);
            return null;
        }
    };

    const getResourcesByIndicator = (indicatorId) => {
        return resources.filter(resource => resource.indicator === indicatorId);
    };

    const refreshResources = () => {
        loadResources();
    };

    // Helper function to generate wrapper_id
    const generateWrapperId = () => {
        return `wrapper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    return (
        <ResourceContext.Provider value={{
            resources,
            loading,
            error,
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