import React, { createContext, useContext, useState, useEffect } from 'react';

const DomainContext = createContext();

export function DomainProvider({ children }) {
    const [domains, setDomains] = useState([]);
    const [indicators, setIndicators] = useState([]);

    useEffect(() => {
        const storedDomains = JSON.parse(localStorage.getItem('domains')) || [];
        const storedIndicators = JSON.parse(localStorage.getItem('indicators')) || [];
        setDomains(storedDomains);
        setIndicators(storedIndicators);
    }, []);

    const updateDomains = (newDomains) => {
        setDomains(newDomains);
        localStorage.setItem('domains', JSON.stringify(newDomains));
    };

    const updateIndicators = (newIndicators) => {
        setIndicators(newIndicators);
        localStorage.setItem('indicators', JSON.stringify(newIndicators));
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

    const addIndicator = (indicator) => {
        const newIndicators = [...indicators, indicator];
        updateIndicators(newIndicators);
        return indicator.id;
    };

    const updateIndicator = (id, updatedIndicator) => {
        const newIndicators = indicators.map(indicator => 
            indicator.id === id ? updatedIndicator : indicator
        );
        updateIndicators(newIndicators);
        return id;
    };

    const deleteIndicator = (id) => {
        const newIndicators = indicators.filter(indicator => indicator.id !== id);
        updateIndicators(newIndicators);
    };

    const getIndicatorById = (id) => {
        const parsedId = parseInt(id);
        return indicators.find(indicator => indicator.id === parsedId) || null;
    };

    const getDomainByName = (name) => {
        return domains.find(domain => domain.name === name) || null;
    };

    return (
        <DomainContext.Provider value={{
            domains,
            indicators,
            addDomain,
            updateDomain,
            deleteDomain,
            addIndicator,
            updateIndicator,
            deleteIndicator,
            getIndicatorById,
            getDomainByName
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