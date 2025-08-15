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
      <details ref={domainRef} className="dropdown md:dropdown-right">
        <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
          <p className="overflow-hidden text-center text-nowrap">
            {stagedDomain?.name || "Escolha o Domínio"}
          </p>
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
          {allDomains.map((dom, index) => (
            <li key={dom?.name || `domain-${index}`}>
              <a onClick={() => handleDomainSelect(dom)}>{dom?.name || "Unnamed Domain"}</a>
            </li>
          ))}
        </ul>
      </details>

      {/* Subdomain Dropdown */}
      {stagedDomain && (
        <details ref={subdomainRef} className="dropdown md:dropdown-right">
          <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
            <p className="overflow-hidden text-center text-nowrap">
              {stagedSubdomain ? (
                <div className="flex items-center gap-2">
                  {console.log('Subdomain dropdown - stagedSubdomain:', stagedSubdomain, 'type:', typeof stagedSubdomain)}
                  {typeof stagedSubdomain === 'string' ? stagedSubdomain : stagedSubdomain?.name}
                  {allowSubdomainClear && (
                    <button onClick={clearSubdomain} className="btn btn-ghost btn-sm">
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                "Escolha o Subdomínio"
              )}
            </p>
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
            {getSubdomainsForDomain(stagedDomain).map((sub, index) => (
              <li key={sub?.name || `subdomain-${index}`}>
                <a onClick={() => handleSubdomainSelect(sub)}>
                  {sub?.name || "Unnamed Subdomain"}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Indicator Dropdown */}
      {stagedSubdomain && (
        <details ref={indicatorRef} className="dropdown md:dropdown-right">
          <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
            <p className="overflow-hidden text-center text-nowrap">
              {stagedIndicator?.name || "Escolha o Indicador"}
            </p>
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
            {getIndicatorsForCurrentSubdomain().length > 0 ? (
              getIndicatorsForCurrentSubdomain().map((ind) => (
                <li key={ind.id}>
                  <a onClick={() => handleIndicatorSelect(ind)}>
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
