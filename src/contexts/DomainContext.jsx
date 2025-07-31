import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const DomainContext = createContext();

export function DomainProvider({ children }) {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDomains();
    }, []);

    const loadDomains = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.get('/api/domains/');
            const domainsData = response.data || [];
            
            // Transform domains to match expected structure
            const transformedDomains = domainsData.map(domain => ({
                ...domain,
                DomainPage: `/${domain.name.toLowerCase()}`,
                DomainColor: domain.color,
                DomainImage: domain.image,
                DomainCarouselImages: [domain.image],
                subdomains: domain.subdomains ? domain.subdomains.map(subdomain => ({ name: subdomain })) : []
            }));
            
            setDomains(transformedDomains);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load domains:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateDomains = (newDomains) => {
        setDomains(newDomains);
    };

    const addDomain = (domain) => {
        const newDomains = [...domains, domain];
        updateDomains(newDomains);
    };

    const updateDomain = (id, updatedDomain) => {
        const newDomains = domains.map(domain => 
            domain.id === id ? updatedDomain : domain
        );
        updateDomains(newDomains);
    };

    const deleteDomain = (id) => {
        const newDomains = domains.filter(domain => domain.id !== id);
        updateDomains(newDomains);
    };

    const getDomainByName = (name) => {
        return domains.find(domain => 
            domain.name === name
        ) || null;
    };

    const getDomainById = (id) => {
        return domains.find(domain => domain.id === id) || null;
    };

    const refreshDomains = () => {
        loadDomains();
    };

    return (
        <DomainContext.Provider value={{
            domains,
            loading,
            error,
            addDomain,
            updateDomain,
            deleteDomain,
            getDomainByName,
            getDomainById,
            refreshDomains
        }}>
            {children}
        </DomainContext.Provider>
    );
}

export function useDomain() {
    const context = useContext(DomainContext);
    if (!context) {
        throw new Error('useDomain must be used within a DomainProvider');
    }
    return context;
} 