import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";

function Dropdowns({ initialDomain, setSelectedSubdomain }) {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setLocalSelectedSubdomain] = useState(null);
  const domainRef = useRef(null);
  const subdomainRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { domains } = useDomain();

  useEffect(() => {
    if (initialDomain) {
      setSelectedDomain(initialDomain);
      setLocalSelectedSubdomain(null);
      setSelectedSubdomain(null);
    }
  }, [initialDomain]);

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
    if (selectedDomain === domain) return;

    navigate(domain.DomainPage, {
      state: { domainName: domain.nome },
    });
    
    if (domainRef.current) domainRef.current.removeAttribute("open");

    setSelectedDomain(domain);
    setLocalSelectedSubdomain(null);
    setSelectedSubdomain(null); 

  };

  const handleSelectSubdomain = (subdom) => {
    if (subdomainRef.current) subdomainRef.current.removeAttribute("open");

    setLocalSelectedSubdomain(subdom);
    setSelectedSubdomain(subdom);

  };

  const clearSubdomain = () => {
    setLocalSelectedSubdomain(null);
    setSelectedSubdomain(null); 
  };

  return (
    <div ref={containerRef} className="container mx-auto">
      <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1">
          {selectedDomain ? selectedDomain.nome : "Escolha o Domínio"}
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {domains.map((domain) => (
            <li key={domain.name}>
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
                {selectedSubdomain.nome}
                <button onClick={(e) => {e.stopPropagation(); clearSubdomain();}}
                  className="btn btn-ghost btn-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              "Escolha o Subdomínio"
            )}
          </summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {selectedDomain.subdomains && selectedDomain.subdomains.map((subdom) => (
              <li key={subdom}>
                <a onClick={() => handleSelectSubdomain({nome: subdom})}>{subdom}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default Dropdowns;
