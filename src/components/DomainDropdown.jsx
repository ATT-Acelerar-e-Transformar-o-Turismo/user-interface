import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";

function Dropdowns({
  selectedDomain,
  selectedSubdomain,
  setSelectedDomain,
  setSelectedSubdomain,
  redirectOnDomainChange = false,
  showIndicatorDropdown = false,
  allowSubdomainClear = true
}) {
  const domainRef = useRef(null);
  const subdomainRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { domains } = useDomain();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (domainRef.current) domainRef.current.removeAttribute("open");
        if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectDomain = (domain) => {
    if (selectedDomain?.nome === domain.nome) return;

    if (redirectOnDomainChange) {
      navigate(domain.DomainPage, {
        state: { domainName: domain.nome },
      });
    }

    if (domainRef.current) domainRef.current.removeAttribute("open");

    setSelectedDomain(domain);
    setSelectedSubdomain(null); // Reset subdomain on domain change
  };

  const handleSelectSubdomain = (subdom) => {
    if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
    setSelectedSubdomain(subdom);
  };

  const clearSubdomain = () => {
    setSelectedSubdomain(null);
  };

  return (
    <div ref={containerRef} className="container mx-auto">
      <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1">
          {selectedDomain ? selectedDomain.nome : "Escolha o Domínio"}
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {domains.map((domain, index) => (
            <li key={domain.nome || index}>
              <a onClick={() => handleSelectDomain(domain)}>{domain.nome}</a>
            </li>
          ))}
        </ul>
      </details>

      {selectedDomain && (
        <details ref={subdomainRef} className="dropdown dropdown-right">
          <summary className="btn m-1">
            {selectedSubdomain ? (
              <div className="flex items-center gap-2">
                {selectedSubdomain.nome}
                {allowSubdomainClear && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSubdomain();
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              "Escolha o Subdomínio"
            )}
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {selectedDomain.subdominios?.map((subdom, index) => (
              <li key={subdom.nome || index}>
                <a onClick={() => handleSelectSubdomain(subdom)}>{subdom.nome}</a>
              </li>
            ))}
            {selectedDomain.subdomains?.map((subdom, index) => (
              <li key={subdom || index}>
                <a onClick={() => handleSelectSubdomain({ nome: subdom })}>
                  {subdom}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default Dropdowns;
