import { useState, useEffect, useRef } from 'react';
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
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false);
  const [isSubdomainDropdownOpen, setIsSubdomainDropdownOpen] = useState(false);
  const domainRef = useRef(null);
  const subdomainRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (domainRef.current && !domainRef.current.contains(event.target)) {
        setIsDomainDropdownOpen(false);
      }
      if (subdomainRef.current && !subdomainRef.current.contains(event.target)) {
        setIsSubdomainDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectDomain = (domain) => {
    const domainName = domain?.name;
    if (!domainName || selectedDomain?.name === domainName) return;

    if (redirectOnDomainChange) {
      navigate(domain.DomainPage || `/${domainName.toLowerCase().replace(/\s+/g, '-')}`, {
        state: { domainName: domainName },
      });
    }

    setSelectedDomain(domain);
    setSelectedSubdomain(null);
    setIsDomainDropdownOpen(false);
  };

  const handleSelectSubdomain = (subdomain) => {
    setSelectedSubdomain(subdomain);
    setIsSubdomainDropdownOpen(false);
  };

  const clearSubdomain = (e) => {
    e.stopPropagation();
    setSelectedSubdomain(null);
  };

  return (
    <div className="flex gap-3">
      {/* Domain Dropdown */}
      <div ref={domainRef} className="relative">
        <button
          onClick={() => setIsDomainDropdownOpen(!isDomainDropdownOpen)}
          className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent hover:bg-gray-200 focus:border-[#00855d] focus:outline-none focus:ring-2 focus:ring-[#00855d]/20 transition-colors flex items-center justify-between gap-2 min-w-[200px]"
        >
          <span>{selectedDomain?.name || "Escolha o Domínio"}</span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isDomainDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Domain Dropdown Menu */}
        {isDomainDropdownOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {domains.map((domain, index) => (
              <button
                key={domain?.name || index}
                onClick={() => handleSelectDomain(domain)}
                className="font-['Onest',sans-serif] text-sm text-black w-full text-left px-4 py-2 hover:bg-[#f1f0f0] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {domain?.name || "Unnamed Domain"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subdomain Dropdown */}
      {selectedDomain && (
        <div ref={subdomainRef} className="relative">
          <button
            onClick={() => setIsSubdomainDropdownOpen(!isSubdomainDropdownOpen)}
            className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent hover:bg-gray-200 focus:border-[#00855d] focus:outline-none focus:ring-2 focus:ring-[#00855d]/20 transition-colors flex items-center justify-between gap-2 min-w-[200px]"
          >
            <span>
              {selectedSubdomain?.name || "Escolha o Subdomínio"}
            </span>
            <div className="flex items-center gap-1">
              {selectedSubdomain?.name && allowSubdomainClear && (
                <button
                  onClick={clearSubdomain}
                  className="hover:bg-gray-300 rounded p-0.5 transition-colors"
                  title="Limpar"
                >
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${isSubdomainDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Subdomain Dropdown Menu */}
          {isSubdomainDropdownOpen && (
            <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {(selectedDomain?.subdomains || []).map((subdom, index) => (
                <button
                  key={typeof subdom === 'string' ? subdom : (subdom?.name || index)}
                  onClick={() => handleSelectSubdomain(typeof subdom === 'string' ? { name: subdom } : subdom)}
                  className="font-['Onest',sans-serif] text-sm text-black w-full text-left px-4 py-2 hover:bg-[#f1f0f0] transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {typeof subdom === 'string' ? subdom : subdom?.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
