import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDomain } from '../contexts/DomainContext';
import PropTypes from 'prop-types';

function Dropdowns({
  selectedDomain,
  setSelectedDomain,
  selectedSubdomain,
  setSelectedSubdomain,
  redirectOnDomainChange = true,
  allowSubdomainClear = true,
}) {
  const { domains } = useDomain();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const domainRef = useRef(null);
  const subdomainRef = useRef(null);

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
    const domainName = domain.name;
    if (selectedDomain?.name === domainName) return;

    if (redirectOnDomainChange) {
      navigate(domain.DomainPage || `/${domainName.toLowerCase().replace(/\s+/g, '-')}`, {
        state: { domainName: domainName },
      });
    }

    setSelectedDomain(domain);
    setSelectedSubdomain(null);
  };

  const handleSelectSubdomain = (subdomain) => {
    if (subdomainRef.current) {
      subdomainRef.current.removeAttribute("open");
    }
    setSelectedSubdomain(subdomain);
  };

  const clearSubdomain = () => {
    setSelectedSubdomain(null);
  };

  return (
    <div ref={containerRef} className="container mx-auto">
      <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1">
          {selectedDomain ? selectedDomain.name : "Escolha o Domínio"}
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {domains.map((domain, index) => (
            <li key={domain.name || index}>
              <a onClick={() => handleSelectDomain(domain)}>{domain.name}</a>
            </li>
          ))}
        </ul>
      </details>

      {selectedDomain && (
        <details ref={subdomainRef} className="dropdown dropdown-right">
          <summary className="btn m-1">
            {selectedSubdomain ? (
              <div className="flex items-center gap-2">
                {selectedSubdomain.name}
                {allowSubdomainClear && (
                  <button onClick={clearSubdomain} className="btn btn-ghost btn-sm">
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <p>Escolha o Subdomínio</p>
            )}
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {(selectedDomain?.subdomains || []).map((subdom, index) => (
              <li key={typeof subdom === 'string' ? subdom : (subdom.name || index)}>
                <a onClick={() => handleSelectSubdomain(typeof subdom === 'string' ? { name: subdom } : subdom)}>
                  {typeof subdom === 'string' ? subdom : subdom.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

Dropdowns.propTypes = {
  selectedDomain: PropTypes.object,
  setSelectedDomain: PropTypes.func.isRequired,
  selectedSubdomain: PropTypes.object,
  setSelectedSubdomain: PropTypes.func.isRequired,
  redirectOnDomainChange: PropTypes.bool,
  allowSubdomainClear: PropTypes.bool,
};

export default Dropdowns;
