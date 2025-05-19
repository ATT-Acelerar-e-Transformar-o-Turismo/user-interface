import { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
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
            onDataTypeSelect(type);
        }
    };

    return (
        <div ref={containerRef}>
            <details ref={domainRef} className="dropdown dropdown-top">
                <summary className="btn m-1">
                    {selectedType ? `Selected: ${selectedType}` : (text || 'Add Data Resource')}
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </summary>
                <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                        <button
                            type="button"
                            onClick={() => handleSelectType("CSV")}
                            className="w-full text-left"
                        >
                            CSV
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            onClick={() => handleSelectType("API")}
                            className="w-full text-left"
                        >
                            API Endpoint
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            onClick={() => handleSelectType("XLSX")}
                            className="w-full text-left"
                        >
                            XLSX
                        </button>
                    </li>
                </ul>
            </details>
        </div>
    );
}

AddDataDropdown.propTypes = {
    onDataTypeSelect: PropTypes.func,
    text: PropTypes.string
};

AddDataDropdown.defaultProps = {
    onDataTypeSelect: undefined,
    text: 'Add Data Resource'
};

export default AddDataDropdown;
