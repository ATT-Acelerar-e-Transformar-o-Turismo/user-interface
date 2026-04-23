import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArea } from '../contexts/AreaContext';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import useLocalizedName from '../hooks/useLocalizedName';

function Dropdowns({
  selectedArea,
  setSelectedArea,
  selectedDimension,
  setSelectedDimension,
  redirectOnAreaChange = true,
  allowDimensionClear = true,
  allowAreaClear = false,
}) {
  const { areas } = useArea();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isDimensionDropdownOpen, setIsDimensionDropdownOpen] = useState(false);
  const areaRef = useRef(null);
  const dimensionRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (areaRef.current && !areaRef.current.contains(event.target)) {
        setIsAreaDropdownOpen(false);
      }
      if (dimensionRef.current && !dimensionRef.current.contains(event.target)) {
        setIsDimensionDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectArea = (area) => {
    const areaName = area?.name;
    if (!areaName || selectedArea?.name === areaName) return;

    if (redirectOnAreaChange) {
      const path = `/indicators/${areaName.toLowerCase().replace(/\s+/g, '-')}`;
      navigate(path, {
        state: { areaId: area?.id },
      });
    }

    setSelectedArea(area);
    setSelectedDimension(null);
    setIsAreaDropdownOpen(false);
  };

  const handleSelectDimension = (dimension) => {
    setSelectedDimension(dimension);
    setIsDimensionDropdownOpen(false);
  };

  const clearArea = (e) => {
    e.stopPropagation();
    setSelectedArea(null);
    setSelectedDimension(null);
  };

  const clearDimension = (e) => {
    e.stopPropagation();
    setSelectedDimension(null);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {/* Area Dropdown */}
      <div ref={areaRef} className="relative">
        <div className="font-['Onest',sans-serif] text-sm text-[#0a0a0a] bg-[#fffefc] border border-[#d4d4d4] rounded-full h-10 px-4 shadow-sm hover:bg-black/[0.02] focus-within:ring-2 focus-within:ring-primary/20 transition-colors flex items-center justify-between gap-2 w-full sm:w-auto sm:min-w-[200px]">
          <span
            role="button"
            tabIndex={0}
            onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsAreaDropdownOpen(!isAreaDropdownOpen); } }}
            className="truncate cursor-pointer flex-1"
          >
            {getName(selectedArea) || t('components.select_area.choose_area')}
          </span>
          <div className="flex items-center gap-1">
            {selectedArea?.name && allowAreaClear && (
              <button
                onClick={clearArea}
                className="hover:bg-black/[0.06] rounded p-0.5 transition-colors cursor-pointer"
                title="Limpar"
              >
                <svg className="w-3 h-3 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg
              className={`w-4 h-4 text-[#0a0a0a] transition-transform shrink-0 cursor-pointer ${isAreaDropdownOpen ? 'rotate-180' : ''}`}
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Area Dropdown Menu */}
        {isAreaDropdownOpen && (
          <div className="absolute z-50 mt-2 w-full bg-[#fffefc] rounded-2xl shadow-lg border border-[#e5e5e5] max-h-60 overflow-y-auto">
            {areas.map((area, index) => (
              <button
                key={area?.name || index}
                onClick={() => handleSelectArea(area)}
                className="font-['Onest',sans-serif] text-sm text-[#0a0a0a] w-full text-left px-4 py-2.5 hover:bg-black/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                {getName(area) || "Unnamed Area"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dimension Dropdown */}
      {selectedArea && (
        <div ref={dimensionRef} className="relative">
          <div className="font-['Onest',sans-serif] text-sm text-[#0a0a0a] bg-[#fffefc] border border-[#d4d4d4] rounded-full h-10 px-4 shadow-sm hover:bg-black/[0.02] focus-within:ring-2 focus-within:ring-primary/20 transition-colors flex items-center justify-between gap-2 w-full sm:w-auto sm:min-w-[200px]">
            <span
              role="button"
              tabIndex={0}
              onClick={() => setIsDimensionDropdownOpen(!isDimensionDropdownOpen)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsDimensionDropdownOpen(!isDimensionDropdownOpen); } }}
              className="truncate cursor-pointer flex-1"
            >
              {getName(selectedDimension) || t('components.select_area.choose_dimension')}
            </span>
            <div className="flex items-center gap-1">
              {selectedDimension?.name && allowDimensionClear && (
                <button
                  onClick={clearDimension}
                  className="hover:bg-black/[0.06] rounded p-0.5 transition-colors cursor-pointer"
                  title="Limpar"
                >
                  <svg className="w-3 h-3 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <svg
                className={`w-4 h-4 text-[#0a0a0a] transition-transform shrink-0 cursor-pointer ${isDimensionDropdownOpen ? 'rotate-180' : ''}`}
                onClick={() => setIsDimensionDropdownOpen(!isDimensionDropdownOpen)}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Dimension Dropdown Menu */}
          {isDimensionDropdownOpen && (
            <div className="absolute z-50 mt-2 w-full bg-[#fffefc] rounded-2xl shadow-lg border border-[#e5e5e5] max-h-60 overflow-y-auto">
              {(selectedArea?.dimensions || []).map((subdom, index) => (
                <button
                  key={typeof subdom === 'string' ? subdom : (subdom?.name || index)}
                  onClick={() => handleSelectDimension(typeof subdom === 'string' ? { name: subdom } : subdom)}
                  className="font-['Onest',sans-serif] text-sm text-[#0a0a0a] w-full text-left px-4 py-2.5 hover:bg-black/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  {getName(subdom)}
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
  selectedArea: PropTypes.object,
  setSelectedArea: PropTypes.func.isRequired,
  selectedDimension: PropTypes.object,
  setSelectedDimension: PropTypes.func.isRequired,
  redirectOnAreaChange: PropTypes.bool,
  allowDimensionClear: PropTypes.bool,
  allowAreaClear: PropTypes.bool,
};

export default Dropdowns;
