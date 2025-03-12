import { useState, useEffect, useRef } from "react";
import domains from "../../public/domains.json";

function Dropdowns({ initialDomain, setSelectedSubdomain }) {
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [selectedSubdomain, setLocalSelectedSubdomain] = useState(null);
    const domainRef = useRef(null);
    const subdomainRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (initialDomain) {
            setSelectedDomain(initialDomain);
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

        if (domainRef.current) {
            domainRef.current.removeAttribute("open"); // Close dropdown first
        }

        setSelectedDomain(domain);
        setLocalSelectedSubdomain(null);
        setSelectedSubdomain(null);
    };

    const handleSelectSubdomain = (subdom) => {
        if (subdomainRef.current) {
            subdomainRef.current.removeAttribute("open"); // Close dropdown first
        }

        setLocalSelectedSubdomain(subdom);
        setSelectedSubdomain(subdom);
    };


    return (
        <div ref={containerRef} className="container mx-auto">
            <details ref={domainRef} className="dropdown dropdown-right">
                <summary className="btn m-1">
                    {selectedDomain ? selectedDomain.nome : "Escolha o Domínio"}
                </summary>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    {domains.dominios.map((domain) => (
                        <li key={domain.nome}>
                            <a onClick={(e) => { handleSelectDomain(domain); }}>{domain.nome}</a>
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
                            </div>
                        ) : (
                            "Escolha o Subdomínio"
                        )}
                    </summary>
                    <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        {selectedDomain.subdominios.map((subdom) => (
                            <li key={subdom.nome}>
                                <a onClick={(e) => { handleSelectSubdomain(subdom); }}>{subdom.nome}</a>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

export default Dropdowns;
