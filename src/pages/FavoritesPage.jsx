import { useState, useEffect, useCallback } from "react";
import PageTemplate from "./PageTemplate";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import { useDomain } from "../contexts/DomainContext";
import indicatorService from "../services/indicatorService";

export default function FavoritesPage() {
  const { domains } = useDomain();
  const [favoriteIndicators, setFavoriteIndicators] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(9);

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
          
          // Resolve domain information (indicator.domain should be a string ID now)
          const domainObj = typeof indicator.domain === 'object' 
            ? indicator.domain 
            : domains.find(domain => domain.id === indicator.domain);
            
          favoriteIndicatorObjects.push({
            ...indicator,
            domainName: domainObj?.name,
            subdomainName: indicator.subdomain,
            domainColor: domainObj?.DomainColor || domainObj?.color
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
  }, [domains]);

  // Load favorites on component mount and when domains are loaded
  useEffect(() => {
    if (domains.length > 0) {
      loadFavorites();
    }
  }, [domains.length, loadFavorites]);

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

  // Filter indicators based on selected domain/subdomain
  const filteredIndicators = favoriteIndicators.filter(indicator => {
    // No domain filter applied
    if (!selectedDomain) {
      return true;
    }
    
    // Filter by domain
    if (indicator.domainName !== selectedDomain?.name) {
      return false;
    }
    
    // Filter by subdomain if selected
    if (selectedSubdomain && indicator.subdomainName !== selectedSubdomain?.name) {
      return false;
    }
    
    return true;
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedDomain, selectedSubdomain]);

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
            redirectOnDomainChange={false}
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
                  ? `Nenhum indicador favorito encontrado para ${selectedDomain?.name || "this domain"}` 
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
                    domain={indicator.domainName}
                    subdomain={indicator.subdomainName}
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