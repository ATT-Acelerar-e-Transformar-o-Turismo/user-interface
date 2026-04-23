import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PageTemplate from "./PageTemplate";
import Dropdowns from "../components/AreaDropdown";
import IndicatorCard from "../components/IndicatorCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import { useArea } from "../contexts/AreaContext";
import indicatorService from "../services/indicatorService";
import useLocalizedName from "../hooks/useLocalizedName";

export default function FavoritesPage() {
  const { areas } = useArea();
  const getName = useLocalizedName();
  const [favoriteIndicators, setFavoriteIndicators] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state — synced with URL so back-navigation restores the page
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '0', 10);
    return Number.isFinite(p) && p >= 0 ? p : 0;
  });
  const [pageSize] = useState(9);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    const urlPage = parseInt(newParams.get('page') || '0', 10) || 0;
    if (urlPage === currentPage) return;
    if (currentPage > 0) newParams.set('page', String(currentPage));
    else newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  }, [currentPage]);

  // Function to load favorites from API
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
      
      if (favorites.length === 0) {
        setFavoriteIndicators([]);
        setLoading(false);
        return;
      }

      // Fetch all favorite indicators from API
      const favoriteIndicatorObjects = [];
      
      for (const favoriteId of favorites) {
        try {
          const indicator = await indicatorService.getById(favoriteId);
          
          // Resolve area information (indicator.area should be a string ID now)
          const areaObj = typeof indicator.area === 'object' 
            ? indicator.area 
            : areas.find(area => area.id === indicator.area);
            
          favoriteIndicatorObjects.push({
            ...indicator,
            areaName: areaObj?.name,
            dimensionName: indicator.dimension,
            areaColor: areaObj?.AreaColor || areaObj?.color
          });
        } catch (err) {
          console.warn(`Failed to load favorite indicator ${favoriteId}:`, err);
        }
      }
      
      setFavoriteIndicators(favoriteIndicatorObjects);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load favorite indicators:', err);
    } finally {
      setLoading(false);
    }
  }, [areas]);

  // Load favorites on component mount and when areas are loaded
  useEffect(() => {
    if (areas.length > 0) {
      loadFavorites();
    }
  }, [areas.length, loadFavorites]);

  // Setup storage event listener
  useEffect(() => {
    // Listen for storage events to refresh favorites when they change
    const handleStorageChange = (e) => {
      if (e.key === 'favoriteIndicators') {
        loadFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadFavorites]);

  // Filter indicators based on selected area/dimension
  const filteredIndicators = favoriteIndicators.filter(indicator => {
    // No area filter applied
    if (!selectedArea) {
      return true;
    }
    
    // Filter by area
    if (indicator.areaName !== selectedArea?.name) {
      return false;
    }
    
    // Filter by dimension if selected
    if (selectedDimension && indicator.dimensionName !== selectedDimension?.name) {
      return false;
    }
    
    return true;
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedArea, selectedDimension]);

  const clearFilters = () => {
    setSelectedArea(null);
    setSelectedDimension(null);
    setCurrentPage(0);
  };

  // Pagination for filtered indicators
  const totalPages = Math.ceil(filteredIndicators.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIndicators = filteredIndicators.slice(startIndex, endIndex);

  // Pagination controls
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          className="btn btn-sm"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        
        <span className="px-4 py-2">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        <button
          className="btn btn-sm"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <PageTemplate>
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold mb-6">My Favorite Indicators</h1>
        <div className="flex flex-col items-center gap-4">
          <Dropdowns
            selectedArea={selectedArea}
            selectedDimension={selectedDimension}
            setSelectedArea={setSelectedArea}
            setSelectedDimension={setSelectedDimension}
            showIndicatorDropdown={false}
            redirectOnAreaChange={false}
            allowDimensionClear={true}
          />
          {(selectedArea || selectedDimension) && (
            <button 
              onClick={clearFilters}
              className="btn btn-outline btn-sm"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>
      
      {loading && <LoadingSkeleton />}
      
      {error && <ErrorDisplay error={error} />}
      
      {!loading && !error && (
        <>
          {filteredIndicators.length === 0 ? (
            <div className="text-center p-8">
              <h2 className="text-xl">
                {selectedArea 
                  ? `Nenhum indicador favorito encontrado para ${getName(selectedArea)}`
                  : "You don't have any favorite indicators yet."}
              </h2>
              <p className="mt-2">Add indicators to favorites by clicking the heart icon on area pages.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap place-content-center gap-4">
                {paginatedIndicators.map((indicator) => (
                  <IndicatorCard
                    key={indicator.id}
                    IndicatorTitle={getName(indicator)}
                    IndicatorId={indicator.id}
                    area={indicator.areaName}
                    dimension={indicator.dimensionName}
                    description={indicator.description}
                    description_en={indicator.description_en}
                    defaultChartType={indicator.default_chart_type}
                  />
                ))}
              </div>
              
              <PaginationControls />
            </>
          )}
        </>
      )}
    </PageTemplate>
  );
} 