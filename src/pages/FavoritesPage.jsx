import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import indicatorService from "../services/indicatorService";

export default function FavoritesPage() {
  const [favoriteIndicators, setFavoriteIndicators] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(9);
  const { domains } = useDomain();

  // Graph icons - reusing the same icons from DomainTemplate
  const GraphTypes = [
    { icon: "📊" },
    { icon: "📈" },
    { icon: "📉" },
    { icon: "📈" },
    { icon: "📉" },
  ];

  // Function to load favorites from API
  const loadFavorites = async () => {
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
          favoriteIndicatorObjects.push({
            ...indicator,
            domainName: indicator.domain?.name,
            subdomainName: indicator.subdomain,
            domainColor: indicator.domain?.DomainColor
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
  };

  // Load favorites on component mount
  useEffect(() => {
    loadFavorites();

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
  }, []);

  // Filter indicators based on selected domain/subdomain
  const filteredIndicators = favoriteIndicators.filter(indicator => {
    // No domain filter applied
    if (!selectedDomain) {
      return true;
    }
    
    // Filter by domain
    if (indicator.domainName !== selectedDomain.name) {
      return false;
    }
    
    // Filter by subdomain if selected
    if (selectedSubdomain && indicator.subdomainName !== selectedSubdomain.name) {
      return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setSelectedDomain(null);
    setSelectedSubdomain(null);
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
            selectedDomain={selectedDomain}
            selectedSubdomain={selectedSubdomain}
            setSelectedDomain={setSelectedDomain}
            setSelectedSubdomain={setSelectedSubdomain}
            showIndicatorDropdown={false}
            allowSubdomainClear={true}
          />
          {(selectedDomain || selectedSubdomain) && (
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
                {selectedDomain 
                  ? `Nenhum indicador favorito encontrado para ${selectedDomain.name}` 
                  : "You don't have any favorite indicators yet."}
              </h2>
              <p className="mt-2">Add indicators to favorites by clicking the heart icon on domain pages.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap place-content-center gap-4">
                {paginatedIndicators.map((indicator) => (
                  <IndicatorCard
                    key={indicator.id}
                    IndicatorTitle={indicator.name}
                    IndicatorId={indicator.id}
                    GraphTypes={GraphTypes}
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