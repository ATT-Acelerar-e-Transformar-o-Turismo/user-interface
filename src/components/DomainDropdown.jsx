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

  // Helper functions to handle both data structures
  const getDomainName = (domain) => {
    return domain?.nome || domain?.name || "Unknown Domain";
  };

  const getDomainId = (domain) => {
    return domain?.id || domain?._id;
  };

  const getSubdomainName = (subdomain) => {
    if (typeof subdomain === 'string') return subdomain;
    return subdomain?.nome || subdomain?.name || "Unknown Subdomain";
  };

  const getAvailableSubdomains = (domain) => {
    if (!domain) return [];
    // Handle both old structure (subdominios) and new structure (subdomains)
    return domain.subdominios || domain.subdomains || [];
  };

  const handleSelectDomain = (domain) => {
    const currentDomainName = getDomainName(selectedDomain);
    const newDomainName = getDomainName(domain);
    
    if (currentDomainName === newDomainName) return;

    if (redirectOnDomainChange) {
      // Create a URL-friendly path from domain name
      const domainPath = newDomainName.toLowerCase().replace(/\s+/g, '-');
      navigate(`/${domainPath}`, {
        state: { domainName: newDomainName },
      });
    }

    if (domainRef.current) domainRef.current.removeAttribute("open");

    setSelectedDomain(domain);
    setSelectedSubdomain(null); // Reset subdomain on domain change
  };

  const handleSelectSubdomain = (subdomainItem) => {
    if (subdomainRef.current) subdomainRef.current.removeAttribute("open");
    
    // Handle both string subdomains and object subdomains
    const subdomainObj = typeof subdomainItem === 'string' 
      ? { nome: subdomainItem, name: subdomainItem }
      : subdomainItem;
      
    setSelectedSubdomain(subdomainObj);
  };

  const clearSubdomain = () => {
    setSelectedSubdomain(null);
  };

  return (
    <div ref={containerRef} className="container mx-auto">
      <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1">
          {selectedDomain ? getDomainName(selectedDomain) : "Escolha o Domínio"}
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {domains.map((domain) => {
            const domainName = getDomainName(domain);
            const domainId = getDomainId(domain);
            return (
              <li key={domainId || domainName}>
                <a onClick={() => handleSelectDomain(domain)}>{domainName}</a>
              </li>
            );
          })}
        </ul>
      </details>

      {selectedDomain && (
        <details ref={subdomainRef} className="dropdown dropdown-right">
          <summary className="btn m-1">
            {selectedSubdomain ? (
              <div className="flex items-center gap-2">
                {getSubdomainName(selectedSubdomain)}
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
            {getAvailableSubdomains(selectedDomain).map((subdomainItem, index) => {
              const subdomainName = typeof subdomainItem === 'string' ? subdomainItem : getSubdomainName(subdomainItem);
              return (
                <li key={subdomainName || index}>
                  <a onClick={() => handleSelectSubdomain(subdomainItem)}>
                    {subdomainName}
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

export default Dropdowns;
