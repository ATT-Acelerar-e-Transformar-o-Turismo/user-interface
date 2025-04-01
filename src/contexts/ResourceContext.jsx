import React, { createContext, useContext, useState, useEffect } from 'react';

const ResourceContext = createContext();

export function ResourceProvider({ children }) {
    const [resources, setResources] = useState([]);

    useEffect(() => {
        const storedResources = JSON.parse(localStorage.getItem('resources')) || [];
        setResources(storedResources);
    }, []);

    const updateResources = (newResources) => {
        setResources(newResources);
        localStorage.setItem('resources', JSON.stringify(newResources));
    };

    const addResource = (resource) => {
        const newResources = [...resources, resource];
        updateResources(newResources);
    };

    const updateResource = (id, updatedResource) => {
        const newResources = resources.map(resource => 
            resource.id === id ? updatedResource : resource
        );
        updateResources(newResources);
    };

    const deleteResource = (id) => {
        const newResources = resources.filter(resource => resource.id !== id);
        updateResources(newResources);
    };

    const getResourcesByIndicator = (indicatorId) => {
        return resources.filter(resource => resource.indicator === indicatorId);
    };

    return (
        <ResourceContext.Provider value={{
            resources,
            addResource,
            updateResource,
            deleteResource,
            getResourcesByIndicator
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