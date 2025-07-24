import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import indicatorService from "../services/indicatorService";

export default function DomainTemplate() {
  const location = useLocation();
  const { domainPath } = useParams();
  const { domainName } = location.state || {};
  const { domains, getDomainByName } = useDomain();
  
  // Determine domain from state or URL path
  // Convert URL path back to domain name (e.g., /ambiente -> Ambiente, /nova-economia -> Nova Economia)
  const pathToDomainName = (path) => {
    const cleanPath = path.replace('/', '');
    return cleanPath
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const inferredDomainName = domainName || pathToDomainName(domainPath || location.pathname);
  
  // Find domain by name in the API domains
  const selectedDomainObj = domains.find((dom) => 
                             (dom.nome === domainName || dom.name === domainName) ||
    (dom.nome === inferredDomainName || dom.name === inferredDomainName) ||
    // Also try lowercase comparison
    (dom.name && dom.name.toLowerCase() === inferredDomainName.toLowerCase())
  ) || getDomainByName(inferredDomainName);

  // API state management
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(12); // 12 indicators per page
  const [totalIndicators, setTotalIndicators] = useState(0);

  // Domain state
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainObj);

  const images = selectedDomainObj?.DomainCarouselImages || [
    "https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp",
    "https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp"
  ];

  // Graph icons
  const GraphTypes = [
    { icon: "📊" },
    { icon: "📈" },
    { icon: "📉" },
    { icon: "📈" },
    { icon: "📉" },
  ];

  // Load indicators from API
  useEffect(() => {
    const loadIndicators = async () => {
      // If no domain is found, don't try to load indicators
      if (!selectedDomainObj?.id) {
        setIndicators([]);
        setTotalIndicators(0);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const skip = currentPage * pageSize;
        let data;
        
        if (selectedSubdomain) {
          // Load indicators for specific subdomain
          data = await indicatorService.getBySubdomain(
            selectedDomainObj.id, 
            selectedSubdomain.nome || selectedSubdomain, 
            skip, 
            pageSize
          );
        } else {
          // Load all indicators for domain
          data = await indicatorService.getByDomain(
            selectedDomainObj.id, 
            skip, 
            pageSize
          );
        }
        
        setIndicators(data || []);
        setTotalIndicators(data?.length || 0);
      } catch (err) {
        console.error('Failed to load indicators:', err);
        setError(`Failed to load indicators: ${err.message}`);
        setIndicators([]);
        setTotalIndicators(0);
      } finally {
        setLoading(false);
      }
    };

    loadIndicators();
  }, [selectedDomainObj?.id, selectedSubdomain, currentPage, pageSize]);

  // Reset pagination when subdomain changes
  const handleSubdomainChange = (subdomain) => {
    setSelectedSubdomain(subdomain);
    setCurrentPage(0);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalIndicators / pageSize);

  // Pagination controls component
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
      <Carousel images={images} />
      <div className="p-4">
        <Dropdowns
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          selectedSubdomain={selectedSubdomain}
          setSelectedSubdomain={handleSubdomainChange}
          showIndicatorDropdown={false}
          redirectOnDomainChange={true}
          allowSubdomainClear={true}
        />
      </div>
      
      {loading && <LoadingSkeleton />}
      
      {error && <ErrorDisplay error={error} />}
      
      {!loading && !error && (
        <>
          <div className="flex flex-wrap place-content-center gap-4">
            {indicators.map((indicator) => (
              <IndicatorCard
                key={indicator.id}
                IndicatorTitle={indicator.name || indicator.nome}
                IndicatorId={indicator.id}
                GraphTypes={GraphTypes}
              />
            ))}
          </div>
          
          {indicators.length === 0 && (
            <div className="text-center p-8">
              <h2 className="text-xl">
                {selectedSubdomain 
                  ? `Nenhum indicador encontrado para ${selectedSubdomain.nome || selectedSubdomain.name}` 
                  : `Nenhum indicador encontrado para ${selectedDomainObj.name || selectedDomainObj.nome || inferredDomainName}`}
              </h2>
            </div>
          )}
          
          <PaginationControls />
        </>
      )}
    </PageTemplate>
  );
}
