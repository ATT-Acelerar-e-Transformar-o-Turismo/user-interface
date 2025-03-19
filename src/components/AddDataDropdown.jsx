
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";


function AddDataDropdown({ onDataTypeSelect, text }) { 
    const domainRef = useRef(null);
    const containerRef = useRef(null);

    const [selectedType, setSelectedType] = useState("");
    

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (domainRef.current) domainRef.current.removeAttribute("open");
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleSelectType = (type) => {
        if (domainRef.current) {
            domainRef.current.removeAttribute("open"); 
        }

        setSelectedType(type);
        if (onDataTypeSelect) {
            onDataTypeSelect(type); // Send selected type to parent component
        }

    };


    return (
        <div ref={containerRef} >
            <details ref={domainRef} className="dropdown dropdown-top">
                <summary className="btn m-1">
                        {selectedType ? `Selected: ${selectedType}` : (text || 'Add Data Resource')}
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </summary>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                        <a onClick={(e) => { handleSelectType("CSV") }}>CSV</a>
                    </li>
                    <li>
                        <a onClick={(e) => { handleSelectType("API") }}>API Endpoint</a>
                    </li>
                    <li>
                        <a onClick={(e) => { handleSelectType("XLSX") }}>XLSX</a>
                    </li>
                </ul>
            </details>

        </div>
    );
}

export default AddDataDropdown
