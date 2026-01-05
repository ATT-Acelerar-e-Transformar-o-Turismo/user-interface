import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useDomain } from "../contexts/DomainContext";
import { useIndicator } from "../contexts/IndicatorContext";

export default function IndicatorDropdowns({
  currentDomain,
  currentSubdomain,
  currentIndicator,
  onIndicatorChange,
  allowSubdomainClear = false,
}) {
  const [stagedDomain, setStagedDomain] = useState(null);
  const [stagedSubdomain, setStagedSubdomain] = useState(null);
  const [stagedIndicator, setStagedIndicator] = useState(null);

  const { domains } = useDomain();
  const { indicators } = useIndicator();

  const domainRef = useRef(null);
  const subdomainRef = useRef(null);
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('IndicatorDropdowns useEffect - setting staged values:', {
      currentDomain,
      currentSubdomain,
      currentIndicator,
      domainSubdomains: currentDomain?.subdomains
    });
    setStagedDomain(currentDomain);
    setStagedSubdomain(currentSubdomain);
    setStagedIndicator(currentIndicator);
  }, [currentDomain, currentSubdomain, currentIndicator]);

  // Close all <details> if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (domainRef.current) domainRef.current.removeAttribute("open");
        if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
        if (indicatorRef.current) indicatorRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);



  const allDomains = domains;

  // Get indicators for the current domain and subdomain
  const getIndicatorsForSubdomain = (domainId, subdomainName) => {
    console.log('Filtering indicators with:', { domainId, subdomainName });
    console.log('All indicators:', indicators.map(ind => ({ 
      id: ind.id, 
      name: ind.name, 
      domain: ind.domain, 
      subdomain: ind.subdomain 
    })));
    
    const filteredIndicators = indicators.filter(indicator => {
      // Domain should now always be a string ID (normalized in IndicatorContext)
      const domainMatch = indicator.domain === domainId;
      const subdomainMatch = indicator.subdomain === subdomainName;
      
      console.log(`Indicator ${indicator.name}:`, {
        domainId,
        domainMatch,
        subdomainMatch,
        indicator: { domain: indicator.domain, subdomain: indicator.subdomain }
      });
      
      return domainMatch && subdomainMatch;
    });
    
    console.log('Filtered indicators result:', filteredIndicators);
    return filteredIndicators;
  };

  const handleDomainSelect = (domain) => {
    if (stagedDomain && stagedDomain?.name === domain?.name) {
      if (domainRef.current) domainRef.current.removeAttribute("open");
      return;
    }
    setStagedDomain(domain);
    setStagedSubdomain(null);
    setStagedIndicator(null);

    if (domainRef.current) domainRef.current.removeAttribute("open");
  };

  const handleSubdomainSelect = (subdomain) => {
    setStagedSubdomain(subdomain);
    // Reset indicator
    setStagedIndicator(null);

    if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
  };

  const handleIndicatorSelect = (indicator) => {
    setStagedIndicator(indicator);
    if (indicatorRef.current) indicatorRef.current.removeAttribute("open");

    // Create compatible objects for the callback
    const domainForCallback = {
      ...stagedDomain,
      nome: stagedDomain?.nome || stagedDomain?.name,
      name: stagedDomain?.name || stagedDomain?.nome
    };
    
    const subdomainForCallback = {
      nome: typeof stagedSubdomain === 'string' ? stagedSubdomain : (stagedSubdomain?.nome || stagedSubdomain?.name),
      name: typeof stagedSubdomain === 'string' ? stagedSubdomain : (stagedSubdomain?.name || stagedSubdomain?.nome)
    };
    
    const indicatorForCallback = {
      ...indicator,
      nome: indicator?.name || indicator?.nome,
      name: indicator?.name || indicator?.nome
    };

    onIndicatorChange(domainForCallback, subdomainForCallback, indicatorForCallback);
  };

  // If the user clicks the X to clear subdomain
  const clearSubdomain = (e) => {
    e.stopPropagation();
    setStagedSubdomain(null);
    setStagedIndicator(null);
  };

  // Get subdomains for the current domain
  const getSubdomainsForDomain = (domain) => {
    if (!domain || !domain.subdomains) {
      console.log('No domain or subdomains:', { domain, hasSubdomains: domain?.subdomains });
      return [];
    }
    console.log('Domain subdomains:', domain.subdomains);
    return domain.subdomains;
  };

  // Get indicators for the current subdomain
  const getIndicatorsForCurrentSubdomain = () => {
    if (!stagedDomain || !stagedSubdomain) {
      console.log('No staged domain or subdomain:', { stagedDomain, stagedSubdomain });
      return [];
    }
    
    // Use standardized domain.id format (no _id)
    const domainId = stagedDomain?.id;
    const subdomainName = typeof stagedSubdomain === 'string' 
      ? stagedSubdomain 
      : stagedSubdomain?.name;
    
    console.log('Getting indicators for:', { domainId, subdomainName, stagedDomain, stagedSubdomain });
    
    return getIndicatorsForSubdomain(domainId, subdomainName);
  };

  return (
    <div ref={containerRef} className="flex flex-nowrap gap-4 flex-col md:flex-row">
      {/* Domain Dropdown */}
      <details ref={domainRef} className="dropdown">
        <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
          <p className={`overflow-hidden text-nowrap truncate ${stagedDomain ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {stagedDomain?.name || "Escolha o Domínio"}
          </p>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
          {allDomains.map((dom, index) => (
            <li key={dom?.name || `domain-${index}`}>
              <a 
                onClick={() => handleDomainSelect(dom)}
                className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
              >
                {dom?.name || "Unnamed Domain"}
              </a>
            </li>
          ))}
        </ul>
      </details>

      {/* Subdomain Dropdown */}
      {stagedDomain && (
        <details ref={subdomainRef} className="dropdown">
          <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <p className={`overflow-hidden text-nowrap truncate ${stagedSubdomain ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {stagedSubdomain ? (
                  typeof stagedSubdomain === 'string' ? stagedSubdomain : stagedSubdomain?.name
                ) : (
                  "Escolha a Dimensão"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {stagedSubdomain && allowSubdomainClear && (
                <button 
                  onClick={clearSubdomain}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
            {getSubdomainsForDomain(stagedDomain).map((sub, index) => (
              <li key={sub?.name || `subdomain-${index}`}>
                <a 
                  onClick={() => handleSubdomainSelect(sub)}
                  className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                >
                  {sub?.name || "Unnamed Subdomain"}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Indicator Dropdown */}
      {stagedSubdomain && (
        <details ref={indicatorRef} className="dropdown">
          <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
            <p className={`overflow-hidden text-nowrap truncate ${stagedIndicator ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {stagedIndicator?.name || "Escolha o Indicador"}
            </p>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
            {getIndicatorsForCurrentSubdomain().length > 0 ? (
              getIndicatorsForCurrentSubdomain().map((ind) => (
                <li key={ind.id}>
                  <a 
                    onClick={() => handleIndicatorSelect(ind)}
                    className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                  >
                    {ind?.name || "Unnamed Indicator"}
                  </a>
                </li>
              ))
            ) : (
              <li><span className="text-gray-500">Nenhum indicador encontrado</span></li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

IndicatorDropdowns.propTypes = {
  currentDomain: PropTypes.object,
  currentSubdomain: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  currentIndicator: PropTypes.object,
  onIndicatorChange: PropTypes.func.isRequired,
  allowSubdomainClear: PropTypes.bool,
};
