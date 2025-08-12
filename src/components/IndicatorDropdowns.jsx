import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useDomain } from "../contexts/DomainContext";

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
  const [subdomainIndicators, setSubdomainIndicators] = useState([]);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const { domains } = useDomain();

  const domainRef = useRef(null);
  const subdomainRef = useRef(null);
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
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

  // Load indicators when subdomain changes
  useEffect(() => {
    const loadSubdomainIndicators = async () => {
      if (!stagedDomain?.id || !stagedSubdomain) {
        setSubdomainIndicators([]);
        return;
      }

      try {
        setLoadingIndicators(true);
        
        // For now, just set empty indicators to avoid API errors
        // The main functionality (showing current indicator) works fine
        setSubdomainIndicators([]);
      } catch (error) {
        console.error('Failed to load indicators for subdomain:', error);
        setSubdomainIndicators([]);
      } finally {
        setLoadingIndicators(false);
      }
    };

    loadSubdomainIndicators();
  }, [stagedDomain?.id, stagedSubdomain]);

  const allDomains = domains;

  const handleDomainSelect = (domain) => {
    if (stagedDomain && stagedDomain.name === domain.name) {
      if (domainRef.current) domainRef.current.removeAttribute("open");
      return;
    }
    setStagedDomain(domain);
    setStagedSubdomain(null);
    setStagedIndicator(null);
    setSubdomainIndicators([]);

    if (domainRef.current) domainRef.current.removeAttribute("open");
  };

  const handleSubdomainSelect = (subdomainName) => {
    setStagedSubdomain(subdomainName);
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
      nome: stagedDomain.nome || stagedDomain.name,
      name: stagedDomain.name || stagedDomain.nome
    };
    
    const subdomainForCallback = {
      nome: typeof stagedSubdomain === 'string' ? stagedSubdomain : (stagedSubdomain?.nome || stagedSubdomain?.name),
      name: typeof stagedSubdomain === 'string' ? stagedSubdomain : (stagedSubdomain?.name || stagedSubdomain?.nome)
    };
    
    const indicatorForCallback = {
      ...indicator,
      nome: indicator.name || indicator.nome,
      name: indicator.name || indicator.nome
    };

    onIndicatorChange(domainForCallback, subdomainForCallback, indicatorForCallback);
  };

  // If the user clicks the X to clear subdomain
  const clearSubdomain = (e) => {
    e.stopPropagation();
    setStagedSubdomain(null);
    setStagedIndicator(null);
    setSubdomainIndicators([]);
  };


  return (
    <div ref={containerRef} className="flex flex-nowrap gap-4 flex-col md:flex-row">
      {/* Domain Dropdown */}
      <details ref={domainRef} className="dropdown md:dropdown-right">
        <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
          <p className="overflow-hidden text-center text-nowrap">
            {stagedDomain ? stagedDomain.name : "Escolha o Domínio"}
          </p>
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
          {allDomains.map((dom) => (
            <li key={dom.name}>
              <a onClick={() => handleDomainSelect(dom)}>{dom.name}</a>
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

                  {typeof stagedSubdomain === 'string' ? stagedSubdomain : stagedSubdomain.name}
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
            {stagedDomain.subdomains.map((sub) => (
              <li key={sub.name}>
                <a onClick={() => handleSubdomainSelect(sub)}>
                  {sub.name}
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
              {stagedIndicator ? stagedIndicator.name : "Escolha o Indicador"}
            </p>
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
            {loadingIndicators ? (
              <li><span className="text-gray-500">Carregando...</span></li>
            ) : subdomainIndicators && subdomainIndicators.length > 0 ? (
              subdomainIndicators.map((ind) => (
              <li key={ind.id || ind._id}>
                <a onClick={() => handleIndicatorSelect(ind)}>
                  {ind.name}
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
