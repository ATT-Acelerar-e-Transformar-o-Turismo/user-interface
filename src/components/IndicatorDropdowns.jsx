import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useDomain } from "../contexts/DomainContext";
import { indicatorService } from "../services/indicatorService";

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
        const subdomainName = typeof stagedSubdomain === 'string' 
          ? stagedSubdomain 
          : (stagedSubdomain.nome || stagedSubdomain.name);
        
        const indicators = await indicatorService.getBySubdomain(
          stagedDomain.id, 
          subdomainName, 
          0, 
          50 // Load up to 50 indicators for dropdown (API limit)
        );
        setSubdomainIndicators(indicators || []);
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
    // Handle both old structure (nome) and new structure (name)
    const domainName = domain.nome || domain.name;
    const currentDomainName = stagedDomain?.nome || stagedDomain?.name;
    
    if (stagedDomain && currentDomainName === domainName) {
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

  // Get domain display name
  const getDomainDisplayName = (domain) => {
    if (!domain) return "Escolha o Domínio";
    return domain.nome || domain.name || "Domínio";
  };

  // Get subdomain display name
  const getSubdomainDisplayName = (subdomain) => {
    if (!subdomain) return "Escolha o Subdomínio";
    if (typeof subdomain === 'string') return subdomain;
    return subdomain.nome || subdomain.name || "Subdomínio";
  };

  // Get indicator display name
  const getIndicatorDisplayName = (indicator) => {
    if (!indicator) return "Escolha o Indicador";
    return indicator.nome || indicator.name || "Indicador";
  };

  // Get available subdomains for the current domain
  const getAvailableSubdomains = () => {
    if (!stagedDomain) return [];
    // Handle both old structure (subdominios) and new structure (subdomains)
    return stagedDomain.subdominios || stagedDomain.subdomains || [];
  };

  return (
    <div ref={containerRef} className="flex flex-nowrap gap-4 flex-col md:flex-row">
      {/* Domain Dropdown */}
      <details ref={domainRef} className="dropdown md:dropdown-right">
        <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
          <p className="overflow-hidden text-center text-nowrap">
            {getDomainDisplayName(stagedDomain)}
          </p>
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
          {allDomains.map((dom) => {
            const domainName = dom.nome || dom.name;
            const domainId = dom.id || dom._id;
            return (
              <li key={domainId || domainName}>
                <a onClick={() => handleDomainSelect(dom)}>{domainName}</a>
              </li>
            );
          })}
        </ul>
      </details>

      {/* Subdomain Dropdown */}
      {stagedDomain && (
        <details ref={subdomainRef} className="dropdown md:dropdown-right">
          <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
            <p className="overflow-hidden text-center text-nowrap">
              {stagedSubdomain ? (
                <div className="flex items-center gap-2">
                  {getSubdomainDisplayName(stagedSubdomain)}
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
            {getAvailableSubdomains().map((subdomainName) => (
              <li key={subdomainName}>
                <a onClick={() => handleSubdomainSelect(subdomainName)}>
                  {subdomainName}
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
              {loadingIndicators 
                ? "Carregando..." 
                : getIndicatorDisplayName(stagedIndicator)
              }
            </p>
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
            {loadingIndicators ? (
              <li><span className="loading loading-spinner loading-sm"></span></li>
            ) : subdomainIndicators.length > 0 ? (
              subdomainIndicators.map((ind) => (
                <li key={ind.id}>
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
