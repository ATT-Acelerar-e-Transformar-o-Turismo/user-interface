import React, { createContext, useContext, useState, useEffect } from 'react';

const ResourceContext = createContext();

export function ResourceProvider({ children }) {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = () => {
        try {
            setLoading(true);
            setError(null);
            const storedResources = JSON.parse(localStorage.getItem('resources')) || [];
            setResources(storedResources);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load resources:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateResources = (newResources) => {
        setResources(newResources);
        localStorage.setItem('resources', JSON.stringify(newResources));
    };

    const addResource = (resource) => {
        try {
            setError(null);
            const newResource = { ...resource, id: Date.now().toString() };
            const newResources = [...resources, newResource];
            updateResources(newResources);
            return newResource;
        } catch (err) {
            setError(err.message);
            console.error('Failed to add resource:', err);
            throw err;
        }
    };

    const updateResource = (id, updatedResource) => {
        try {
            setError(null);
            const newResources = resources.map(resource => 
                resource.id === id ? { ...resource, ...updatedResource } : resource
            );
            updateResources(newResources);
            return newResources.find(resource => resource.id === id);
        } catch (err) {
            setError(err.message);
            console.error('Failed to update resource:', err);
            throw err;
        }
    };

    const deleteResource = (id) => {
        try {
            setError(null);
            const newResources = resources.filter(resource => resource.id !== id);
            updateResources(newResources);
        } catch (err) {
            setError(err.message);
            console.error('Failed to delete resource:', err);
            throw err;
        }
    };

    const getResourceById = (id) => {
        return resources.find(resource => resource.id === id) || null;
    };

    const getResourcesByIndicator = (indicatorId) => {
        return resources.filter(resource => resource.indicator === indicatorId);
    };

    const refreshResources = () => {
        loadResources();
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

export function useResource() {
    const context = useContext(ResourceContext);
    if (!context) {
        throw new Error('useResource must be used within a ResourceProvider');
    }
    return context;
} 