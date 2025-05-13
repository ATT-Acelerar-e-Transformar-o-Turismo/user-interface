import { useState, useEffect, useRef } from "react";
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

  const allDomains = domains;

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
    <div ref={containerRef} className="flex flex-nowrap gap-4 flex-col md:flex-row">
      {/* Domain Dropdown */}
      <details ref={domainRef} className="dropdown md:dropdown-right">
        <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
          <p className="overflow-hidden text-center text-nowrap">
            {stagedDomain ? stagedDomain.nome : "Escolha o Domínio"}
          </p>
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
          {allDomains.map((dom) => (
            <li key={dom.nome}>
              <a onClick={() => handleDomainSelect(dom)}>{dom.nome}</a>
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
            </p>
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
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
        <details ref={indicatorRef} className="dropdown md:dropdown-right">
          <summary className="btn m-1 w-full md:w-fit md:max-w-48 lg:max-w-72 xl:max-w-96">
            <p className="overflow-hidden text-center text-nowrap">
              {stagedIndicator ? stagedIndicator.nome : "Escolha o Indicador"}
            </p>
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full md:w-48 lg:w-72 xl:w-96">
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
