import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useArea } from "../contexts/AreaContext";
import indicatorService from "../services/indicatorService";
import { useTranslation } from "react-i18next";
import useLocalizedName from "../hooks/useLocalizedName";

export default function IndicatorDropdowns({
  currentArea,
  currentDimension,
  currentIndicator,
  onIndicatorChange,
  allowDimensionClear = false,
}) {
  const [stagedArea, setStagedArea] = useState(null);
  const [stagedDimension, setStagedDimension] = useState(null);
  const [stagedIndicator, setStagedIndicator] = useState(null);
  const [dimensionIndicators, setDimensionIndicators] = useState([]);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);

  const { areas } = useArea();
  const { t } = useTranslation();
  const getName = useLocalizedName();

  const areaRef = useRef(null);
  const dimensionRef = useRef(null);
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('IndicatorDropdowns useEffect - setting staged values:', {
      currentArea,
      currentDimension,
      currentIndicator,
      areaDimensions: currentArea?.dimensions
    });
    setStagedArea(currentArea);
    setStagedDimension(currentDimension);
    setStagedIndicator(currentIndicator);
  }, [currentArea, currentDimension, currentIndicator]);

  // Fetch indicators when area + dimension are selected
  useEffect(() => {
    let cancelled = false;
    const fetchIndicators = async () => {
      const areaId = stagedArea?.id;
      const dimensionName = typeof stagedDimension === 'string'
        ? stagedDimension
        : stagedDimension?.name;

      if (!areaId || !dimensionName) {
        setDimensionIndicators([]);
        return;
      }

      setIndicatorsLoading(true);
      try {
        const data = await indicatorService.getByDimension(areaId, dimensionName, 0, 50);
        if (!cancelled) {
          setDimensionIndicators(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch dimension indicators:', err);
        if (!cancelled) {
          setDimensionIndicators([]);
        }
      } finally {
        if (!cancelled) {
          setIndicatorsLoading(false);
        }
      }
    };
    fetchIndicators();
    return () => { cancelled = true; };
  }, [stagedArea?.id, stagedDimension]);

  // Close all <details> if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (areaRef.current) areaRef.current.removeAttribute("open");
        if (dimensionRef.current) dimensionRef.current.removeAttribute("open");
        if (indicatorRef.current) indicatorRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);



  const allAreas = areas;

  const handleAreaSelect = (area) => {
    if (stagedArea && stagedArea?.name === area?.name) {
      if (areaRef.current) areaRef.current.removeAttribute("open");
      return;
    }
    setStagedArea(area);
    setStagedDimension(null);
    setStagedIndicator(null);

    if (areaRef.current) areaRef.current.removeAttribute("open");
  };

  const handleDimensionSelect = (dimension) => {
    setStagedDimension(dimension);
    // Reset indicator
    setStagedIndicator(null);

    if (dimensionRef.current) dimensionRef.current.removeAttribute("open");
  };

  const handleIndicatorSelect = (indicator) => {
    setStagedIndicator(indicator);
    if (indicatorRef.current) indicatorRef.current.removeAttribute("open");

    // Create compatible objects for the callback
    const areaForCallback = {
      ...stagedArea,
      nome: stagedArea?.nome || stagedArea?.name,
      name: stagedArea?.name || stagedArea?.nome
    };
    
    const dimensionForCallback = {
      nome: typeof stagedDimension === 'string' ? stagedDimension : (stagedDimension?.nome || stagedDimension?.name),
      name: typeof stagedDimension === 'string' ? stagedDimension : (stagedDimension?.name || stagedDimension?.nome)
    };
    
    const indicatorForCallback = {
      ...indicator,
      nome: indicator?.name || indicator?.nome,
      name: indicator?.name || indicator?.nome
    };

    onIndicatorChange(areaForCallback, dimensionForCallback, indicatorForCallback);
  };

  // If the user clicks the X to clear dimension
  const clearDimension = (e) => {
    e.stopPropagation();
    setStagedDimension(null);
    setStagedIndicator(null);
  };

  // Get dimensions for the current area
  const getDimensionsForArea = (area) => {
    if (!area || !area.dimensions) {
      console.log('No area or dimensions:', { area, hasDimensions: area?.dimensions });
      return [];
    }
    console.log('Area dimensions:', area.dimensions);
    return area.dimensions;
  };


  return (
    <div ref={containerRef} className="flex flex-nowrap gap-4 flex-col md:flex-row">
      {/* Area Dropdown */}
      <details ref={areaRef} className="dropdown">
        <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
          <p className={`overflow-hidden text-nowrap truncate ${stagedArea ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {getName(stagedArea) || t('components.select_area.choose_area')}
          </p>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
          {allAreas.map((dom, index) => (
            <li key={dom?.name || `area-${index}`}>
              <a 
                onClick={() => handleAreaSelect(dom)}
                className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
              >
                {getName(dom) || "Unnamed Area"}
              </a>
            </li>
          ))}
        </ul>
      </details>

      {/* Dimension Dropdown */}
      {stagedArea && (
        <details ref={dimensionRef} className="dropdown">
          <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <p className={`overflow-hidden text-nowrap truncate ${stagedDimension ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {getName(stagedDimension) || t('components.select_area.choose_dimension')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {stagedDimension && allowDimensionClear && (
                <button 
                  onClick={clearDimension}
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
            {getDimensionsForArea(stagedArea).map((sub, index) => (
              <li key={sub?.name || `dimension-${index}`}>
                <a 
                  onClick={() => handleDimensionSelect(sub)}
                  className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                >
                  {getName(sub) || "Unnamed Dimension"}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Indicator Dropdown */}
      {stagedDimension && (
        <details ref={indicatorRef} className="dropdown">
          <summary className="flex items-center justify-between w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors list-none">
            <p className={`overflow-hidden text-nowrap truncate ${stagedIndicator ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {getName(stagedIndicator) || t('components.select_area.choose_indicator')}
            </p>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <ul className="dropdown-content menu p-2 shadow-lg bg-white border border-gray-100 rounded-lg w-full md:w-64 z-50 mt-2">
            {indicatorsLoading ? (
              <li><span className="text-gray-500 loading loading-spinner loading-sm"></span></li>
            ) : dimensionIndicators.length > 0 ? (
              dimensionIndicators.map((ind) => (
                <li key={ind.id}>
                  <a 
                    onClick={() => handleIndicatorSelect(ind)}
                    className="text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                  >
                    {getName(ind) || "Unnamed Indicator"}
                  </a>
                </li>
              ))
            ) : (
              <li><span className="text-gray-500">{t('components.select_area.no_indicators')}</span></li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

IndicatorDropdowns.propTypes = {
  currentArea: PropTypes.object,
  currentDimension: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  currentIndicator: PropTypes.object,
  onIndicatorChange: PropTypes.func.isRequired,
  allowDimensionClear: PropTypes.bool,
};
