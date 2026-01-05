import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDomain } from '../contexts/DomainContext';

function SelectDomain({ 
  setSelectedDomain, 
  setSelectedSubdomain, 
  domains: propDomains,
  selectedDomain: propSelectedDomain,
  selectedSubdomain: propSelectedSubdomain
}) {
    const [selectedLocalDomain, setSelectedLocalDomain] = useState(null);
    const [selectedLocalSubdomain, setSelectedLocalSubdomain] = useState(null);
    const domainRef = useRef(null);
    const subdomainRef = useRef(null);
    const containerRef = useRef(null);
    
    // Use prop domains if provided, otherwise fallback to context
    const { domains: contextDomains } = useDomain();
    const domains = propDomains || contextDomains;

    // Initialize local state with provided values when editing
    useEffect(() => {
        if (propSelectedDomain) {
            setSelectedLocalDomain(propSelectedDomain);
        }
        if (propSelectedSubdomain) {
            setSelectedLocalSubdomain(propSelectedSubdomain);
        }
    }, [propSelectedDomain, propSelectedSubdomain]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (domainRef.current) domainRef.current.removeAttribute("open");
                if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectDomain = (domain) => {
        if (domainRef.current) {
            domainRef.current.removeAttribute("open"); // Close dropdown first
        }

        setSelectedLocalDomain(domain);
        setSelectedLocalSubdomain(null);
        
        // Call parent callbacks with the full domain object and clear subdomain
        setSelectedDomain(domain); // Pass full domain object to the parent
        setSelectedSubdomain(null);
    };

    const handleSelectSubdomain = (subdom) => {
        if (subdomainRef.current) {
            subdomainRef.current.removeAttribute("open"); // Close dropdown first
        }

        const subdomainName = typeof subdom === 'string' ? subdom : subdom.name;
        setSelectedLocalSubdomain(subdomainName);
        setSelectedSubdomain(subdomainName); // Update main page with subdomain name
    };

    const getSubdomains = () => {
        if (!selectedLocalDomain) return [];
        return selectedLocalDomain.subdomains || selectedLocalDomain.subdominios || [];
    };

    return (
        <div ref={containerRef} className="container mx-auto flex flex-col md:flex-row gap-4">
            <details ref={domainRef} className="dropdown">
                <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
                    <span className={`${selectedLocalDomain ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {selectedLocalDomain?.name || "Escolha o Domínio"}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
                    {domains.map((domain, index) => (
                        <li key={domain?.name || index}>
                            <a 
                                onClick={() => { handleSelectDomain(domain); }}
                                className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                            >
                                {domain?.name || "Unnamed Domain"}
                            </a>
                        </li>
                    ))}
                </ul>
            </details>

            {selectedLocalDomain && (
                <details ref={subdomainRef} className="dropdown">
                    <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
                        {
                        selectedLocalSubdomain 
                        ? (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-medium">{selectedLocalSubdomain}</span>
                            </div>) 
                        : (
                            <span className="text-gray-500">Escolha a Dimensão</span>)
                        }
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
                        {(getSubdomains()).map((subdom) => {
                            const subName = typeof subdom === 'string' ? subdom : subdom.name;
                            return (
                                <li key={subName}>
                                    <a 
                                        onClick={() => { handleSelectSubdomain(subdom); }}
                                        className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                                    >
                                        {subName}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </details>
            )}
        </div>
    );
}

export default SelectDomain;

SelectDomain.propTypes = {
    setSelectedDomain: PropTypes.func.isRequired,
    setSelectedSubdomain: PropTypes.func.isRequired,
    domains: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            subdomains: PropTypes.array,
            subdominios: PropTypes.array,
        })
    ),
    selectedDomain: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    selectedSubdomain: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};
