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
    const cleanPath = path.replace("/", "");
    return cleanPath
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const inferredDomainName = domainName || pathToDomainName(domainPath || location.pathname);
  
  // Find domain by name or fallback to mock domain for testing
  const selectedDomainObj = domains.find(dom => 
    dom.name === domainName || dom.name === inferredDomainName
  ) || getDomainByName(inferredDomainName) || {
    id: location.pathname.replace("/", ""),
    name: inferredDomainName || "Test Domain",
    DomainCarouselImages: [
      "https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp",
      "https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp"
    ]
  };

  // API state management
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(9); // 9 indicators per page
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
      // Wait for domains to load from API
      if (domains.length === 0) {
        setLoading(false);
        return;
      }
      
      if (!selectedDomainObj?.id || !selectedDomainObj.id.match(/^[a-fA-F0-9]{24}$/)) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const skip = currentPage * pageSize;
        let data;
        
        // Always use the general API with client-side filtering for now
        // since domain-specific endpoints may not be working correctly
        const allIndicators = await indicatorService.getAll(0, 50); // Get indicators for filtering (API limit is 50)
        let filteredData = allIndicators.filter(indicator => indicator.domain === selectedDomainObj.id);
        
        // Apply subdomain filter if selected
        if (selectedSubdomain) {
          filteredData = filteredData.filter(indicator => indicator.subdomain === selectedSubdomain.name);
        }
        
        // Apply pagination to filtered data
        const startIndex = skip;
        const endIndex = startIndex + pageSize;
        data = filteredData.slice(startIndex, endIndex);
        
        setIndicators(data || []);
        setTotalIndicators(filteredData.length);
      } catch (err) {
        console.error("Failed to load indicators:", err);
        setError(err.message);
        setIndicators([]);
        setTotalIndicators(0);
      } finally {
        setLoading(false);
      }
    };

    loadIndicators();
  }, [selectedDomainObj?.id, selectedSubdomain, currentPage, pageSize, domains]);

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
                IndicatorTitle={indicator.name}
                IndicatorId={indicator.id}
                GraphTypes={GraphTypes}
                domain={selectedDomainObj.name}
                subdomain={selectedSubdomain?.name}
              />
            ))}
          </div>
          
          {indicators.length === 0 && (
            <div className="text-center p-8">
              <h2 className="text-xl">
                {selectedSubdomain 
                  ? `No indicators found for ${selectedSubdomain.name}` 
                  : `No indicators found for ${selectedDomainObj.name || inferredDomainName}`}
              </h2>
            </div>
          )}
          
          <PaginationControls />
        </>
      )}
    </PageTemplate>
  );
}
