import { useState, useEffect, useRef } from "react";
import domainsData from "../../public/domains.json";

// This component is dedicated to the Indicator page use-case.
// It "stages" domain/subdomain/indicator changes and only commits them
// when the user actually picks a new indicator.
export default function IndicatorDropdowns({
  // The currently displayed domain/subdomain/indicator from the parent
  currentDomain,
  currentSubdomain,
  currentIndicator,

  // This is called once the user selects a new indicator from the 3rd dropdown
  onIndicatorChange,

  // If you want to hide the X next to subdomain:
  allowSubdomainClear = false,
}) {
  const [stagedDomain, setStagedDomain] = useState(null);
  const [stagedSubdomain, setStagedSubdomain] = useState(null);
  const [stagedIndicator, setStagedIndicator] = useState(null);

  const domainRef = useRef(null);
  const subdomainRef = useRef(null);
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);

  // On mount or if the parent’s currentDomain/currentSubdomain/currentIndicator changes,
  // set our staging states to match.
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

  // We’ll use the full domains data so we can map them in the dropdown
  // If you want to pass them in, you can do that too.
  const allDomains = domainsData.dominios;

  // Handle domain selection (only updates local “stagedDomain”)
  const handleDomainSelect = (domain) => {
    // If the user selects the same domain, just close
    if (stagedDomain && stagedDomain.nome === domain.nome) {
      if (domainRef.current) domainRef.current.removeAttribute("open");
      return;
    }
    setStagedDomain(domain);
    // Reset subdomain and indicator whenever domain changes
    setStagedSubdomain(null);
    setStagedIndicator(null);

    if (domainRef.current) domainRef.current.removeAttribute("open");
  };

  // Handle subdomain selection (only updates local “stagedSubdomain”)
  const handleSubdomainSelect = (subdom) => {
    setStagedSubdomain(subdom);
    // Reset indicator
    setStagedIndicator(null);

    if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
  };

  // Handle indicator selection
  // -> Once the user picks an indicator, commit all to the parent
  const handleIndicatorSelect = (indicator) => {
    setStagedIndicator(indicator);
    if (indicatorRef.current) indicatorRef.current.removeAttribute("open");

    // We call the parent callback to "commit" the new domain, subdomain, indicator
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
