import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useArea } from '../contexts/AreaContext';
import useLocalizedName from '../hooks/useLocalizedName';

function SelectArea({
  setSelectedArea,
  setSelectedDimension,
  areas: propAreas,
  selectedArea: propSelectedArea,
  selectedDimension: propSelectedDimension
}) {
    const { t } = useTranslation();
    const getName = useLocalizedName();
    const [selectedLocalArea, setSelectedLocalArea] = useState(null);
    const [selectedLocalDimension, setSelectedLocalDimension] = useState(null);
    const areaRef = useRef(null);
    const dimensionRef = useRef(null);
    const containerRef = useRef(null);
    
    // Use prop areas if provided, otherwise fallback to context
    const { areas: contextAreas } = useArea();
    const areas = propAreas || contextAreas;

    // Initialize local state with provided values when editing
    useEffect(() => {
        if (propSelectedArea) {
            setSelectedLocalArea(propSelectedArea);
        }
        if (propSelectedDimension) {
            setSelectedLocalDimension(propSelectedDimension);
        }
    }, [propSelectedArea, propSelectedDimension]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (areaRef.current) areaRef.current.removeAttribute("open");
                if (dimensionRef.current) dimensionRef.current.removeAttribute("open");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectArea = (area) => {
        if (areaRef.current) {
            areaRef.current.removeAttribute("open"); // Close dropdown first
        }

        setSelectedLocalArea(area);
        setSelectedLocalDimension(null);
        
        // Call parent callbacks with the full area object and clear dimension
        setSelectedArea(area); // Pass full area object to the parent
        setSelectedDimension(null);
    };

    const handleSelectDimension = (subdom) => {
        if (dimensionRef.current) {
            dimensionRef.current.removeAttribute("open"); // Close dropdown first
        }

        const dimensionName = typeof subdom === 'string' ? subdom : subdom.name;
        setSelectedLocalDimension(dimensionName);
        setSelectedDimension(dimensionName); // Update main page with dimension name
    };

    const getDimensions = () => {
        if (!selectedLocalArea) return [];
        return selectedLocalArea.dimensions || selectedLocalArea.subdominios || [];
    };

    return (
        <div ref={containerRef} className="container mx-auto flex flex-col md:flex-row gap-4">
            <details ref={areaRef} className="dropdown">
                <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
                    <span className={`${selectedLocalArea ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {getName(selectedLocalArea) || t('components.select_area.choose_area')}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
                    {areas.map((area, index) => (
                        <li key={area?.name || index}>
                            <a 
                                onClick={() => { handleSelectArea(area); }}
                                className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                            >
                                {area?.name || "Unnamed Area"}
                            </a>
                        </li>
                    ))}
                </ul>
            </details>

            {selectedLocalArea && (
                <details ref={dimensionRef} className="dropdown">
                    <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
                        {
                        selectedLocalDimension 
                        ? (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-medium">{selectedLocalDimension}</span>
                            </div>) 
                        : (
                            <span className="text-gray-500">{t('components.select_area.choose_dimension')}</span>)
                        }
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
                        {(getDimensions()).map((subdom) => {
                            const subName = typeof subdom === 'string' ? subdom : subdom.name;
                            return (
                                <li key={subName}>
                                    <a 
                                        onClick={() => { handleSelectDimension(subdom); }}
                                        className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                                    >
                                        {subName}
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

export default SelectArea;

SelectArea.propTypes = {
    setSelectedArea: PropTypes.func.isRequired,
    setSelectedDimension: PropTypes.func.isRequired,
    areas: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            dimensions: PropTypes.array,
            subdominios: PropTypes.array,
        })
    ),
    selectedArea: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    selectedDimension: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};
