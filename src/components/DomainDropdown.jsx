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
    const domainName = domain?.name;
    if (!domainName || selectedDomain?.name === domainName) return;

    if (redirectOnDomainChange) {
      const path = domain.DomainPage || `/indicators/${domainName.toLowerCase().replace(/\s+/g, '-')}`;
      navigate(path, {
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
    <div ref={containerRef} className="container mx-auto flex flex-col md:flex-row gap-4">
      <details ref={domainRef} className="dropdown">
        <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
          <span className={`${selectedDomain ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {selectedDomain?.name || "Escolha o Domínio"}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
          {domains.map((domain, index) => (
            <li key={domain?.name || index}>
              <a 
                onClick={() => handleSelectDomain(domain)}
                className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
              >
                {domain?.name || "Unnamed Domain"}
              </a>
            </li>
          ))}
        </ul>
      </details>

      {selectedDomain && (
        <details ref={subdomainRef} className="dropdown">
          <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
            <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`${selectedSubdomain ? 'text-gray-900 font-medium' : 'text-gray-500'} truncate`}>
                          {selectedSubdomain?.name || "Escolha a Dimensão"}
                        </span>            </div>
            <div className="flex items-center gap-2">
              {selectedSubdomain?.name && allowSubdomainClear && (
                <button 
                  onClick={(e) => { e.preventDefault(); clearSubdomain(); }}
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
            {(selectedDomain?.subdomains || []).map((subdom, index) => (
              <li key={typeof subdom === 'string' ? subdom : (subdom?.name || index)}>
                <a 
                  onClick={() => handleSelectSubdomain(typeof subdom === 'string' ? { name: subdom } : subdom)}
                  className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                >
                  {typeof subdom === 'string' ? subdom : subdom?.name}
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
