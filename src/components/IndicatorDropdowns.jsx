import { useState, useEffect, useRef } from "react";
import domainsData from "../../public/domains.json";

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

  const allDomains = domainsData.dominios;

  const handleDomainSelect = (domain) => {
    if (stagedDomain && stagedDomain.nome === domain.nome) {
      if (domainRef.current) domainRef.current.removeAttribute("open");
      return;
    }
    setStagedDomain(domain);
    setStagedSubdomain(null);
    setStagedIndicator(null);

    if (domainRef.current) domainRef.current.removeAttribute("open");
  };

  const handleSubdomainSelect = (subdom) => {
    setStagedSubdomain(subdom);
    // Reset indicator
    setStagedIndicator(null);

    if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
  };

  const handleIndicatorSelect = (indicator) => {
    setStagedIndicator(indicator);
    if (indicatorRef.current) indicatorRef.current.removeAttribute("open");

    onIndicatorChange(stagedDomain, stagedSubdomain, indicator);
  };

  // If the user clicks the X to clear subdomain
  const clearSubdomain = (e) => {
    e.stopPropagation();
    setStagedSubdomain(null);
    setStagedIndicator(null);
  };

  return (
    <div ref={containerRef} className="flex flex-wrap gap-4">
      {/* Domain Dropdown */}
      <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1">
          {stagedDomain ? stagedDomain.nome : "Escolha o Domínio"}
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {allDomains.map((dom) => (
            <li key={dom.nome}>
              <a onClick={() => handleDomainSelect(dom)}>{dom.nome}</a>
            </li>
          ))}
        </ul>
      </details>

      {/* Subdomain Dropdown */}
      {stagedDomain && (
        <details ref={subdomainRef} className="dropdown dropdown-right">
          <summary className="btn m-1">
            {stagedSubdomain ? (
              <div className="flex items-center gap-2">
                {stagedSubdomain.nome}
                {allowSubdomainClear && (
                  <button onClick={clearSubdomain} className="btn btn-ghost btn-sm">
                    ✕
                  </button>
                )}
              </div>
            ) : (
              "Escolha o Subdomínio"
            )}
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {stagedDomain.subdominios.map((sub) => (
              <li key={sub.nome}>
                <a onClick={() => handleSubdomainSelect(sub)}>
                  {sub.nome}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Indicator Dropdown */}
      {stagedSubdomain && (
        <details ref={indicatorRef} className="dropdown dropdown-right">
          <summary className="btn m-1">
            {stagedIndicator ? stagedIndicator.nome : "Escolha o Indicador"}
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {stagedSubdomain.indicadores.map((ind) => (
              <li key={ind.id}>
                <a onClick={() => handleIndicatorSelect(ind)}>
                  {ind.nome}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
