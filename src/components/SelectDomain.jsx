import { useState, useEffect, useRef } from "react";
import domains from "../../public/domains.json";

function SelectDomain({ setSelectedDomain, setSelectedSubdomain }) {

    const [selectedLocalDomain, setSelectedLocalDomain] = useState(null);
    const [selectedLocalSubdomain, setSelectedLocalSubdomain] = useState(null);

    const domainRef = useRef(null);
    const subdomainRef = useRef(null);
    const containerRef = useRef(null);

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

        if (domainRef.current) {
            domainRef.current.removeAttribute("open"); // Close dropdown first
        }

        setSelectedLocalDomain(domain);
        setSelectedLocalSubdomain(null);
        setSelectedDomain(domain); // Update main page
        setSelectedSubdomain(null);
    };

    const handleSelectSubdomain = (subdom) => {
        if (subdomainRef.current) {
            subdomainRef.current.removeAttribute("open"); // Close dropdown first
        }

        setSelectedLocalSubdomain(subdom);
        setSelectedSubdomain(subdom); // Update main page
    };


    return (
        <div ref={containerRef} className="container mx-auto">
            <details ref={domainRef} className="dropdown dropdown-right">
                <summary className="btn m-1">
                    {selectedLocalDomain ? selectedLocalDomain.nome : "Escolha o Domínio"}
                </summary>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    {domains.dominios.map((domain) => (
                        <li key={domain.nome}>
                            <a onClick={(e) => { handleSelectDomain(domain); }}>{domain.nome}</a>
                        </li>
                    ))}
                </ul>
            </details>

            {selectedLocalDomain && (
                <details ref={subdomainRef} className="dropdown dropdown-right">
                    <summary className="btn m-1">
                        {
                        selectedLocalSubdomain 
                        ? (
                            <div className="flex items-center gap-2">
                                {selectedLocalSubdomain.nome}
                            </div>) 
                        : (
                            "Escolha o Subdomínio")
                        }
                    </summary>
                    <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        {selectedLocalDomain.subdominios.map((subdom) => (
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

export default SelectDomain;
