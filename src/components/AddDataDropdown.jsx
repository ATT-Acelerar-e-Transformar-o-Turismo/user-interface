
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";


function AddDataDropdown({ }) { 
    const domainRef = useRef(null);
    const containerRef = useRef(null);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (domainRef.current) domainRef.current.removeAttribute("open");
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleSelectDomain = () => {
        if (domainRef.current) {
            domainRef.current.removeAttribute("open"); // Close dropdown first
        }

    };


    return (
        <div ref={containerRef} >
            <details ref={domainRef} className="dropdown dropdown-right">
                <summary className="btn m-1">
                    Add data
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </summary>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                        <a onClick={(e) => { handleSelectDomain() }}>CSV</a>
                    </li>
                    <li>
                        <a onClick={(e) => { handleSelectDomain() }}>API Endpoint</a>
                    </li>
                    <li>
                        <a onClick={(e) => { handleSelectDomain() }}>XLSX</a>
                    </li>
                </ul>
            </details>

        </div>
    );
}

export default AddDataDropdown
