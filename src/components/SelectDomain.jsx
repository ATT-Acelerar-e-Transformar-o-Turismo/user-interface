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
        <div ref={containerRef} className="container mx-auto">
            <details ref={domainRef} className="dropdown dropdown-right">
                <summary className="btn m-1">
                    {selectedLocalDomain ? selectedLocalDomain.name : "Escolha o Domínio"}
                </summary>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    {domains.map((domain) => (
                        <li key={domain.name}>
                            <a onClick={() => { handleSelectDomain(domain); }}>{domain.name}</a>
                        </li>
                    ))}
                </ul>
            </details>

            {selectedLocalDomain && (
                <details ref={subdomainRef} className="dropdown dropdown-right">
                    <summary className="btn m-1">
                        {
                        selectedLocalSubdomain 
                        ? (
                            <div className="flex items-center gap-2">
                                {selectedLocalSubdomain}
                            </div>) 
                        : (
                            "Escolha o Subdomínio")
                        }
                    </summary>
                    <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        {(getSubdomains()).map((subdom) => {
                            const subName = typeof subdom === 'string' ? subdom : subdom.name;
                            return (
                                <li key={subName}>
                                    <a onClick={() => { handleSelectSubdomain(subdom); }}>{subName}</a>
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
