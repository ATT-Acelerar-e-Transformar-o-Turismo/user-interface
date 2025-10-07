import { useState, useEffect } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import Pagination from "../components/Pagination";
import indicatorService from "../services/indicatorService";
import { highlightSearchTerms } from "../services/searchUtils";

export default function DomainTemplate() {
  const location = useLocation();
  const { domainPath } = useParams();
  const { domainName } = location.state || {};
  const { domains, getDomainByName } = useDomain();
  const [searchParams] = useSearchParams();
  
  // Check if this is a search results page
  const searchQuery = searchParams.get('q');
  const isSearchMode = Boolean(searchQuery);
  
  // Determine domain from state or URL path
  // Convert URL path back to domain name (e.g., /ambiente -> Ambiente, /nova-economia -> Nova Economia)
  const pathToDomainName = (path) => {
    if (!path || typeof path !== 'string') return "";
    const cleanPath = path.replace("/", "");
    if (!cleanPath) return "";
    return cleanPath
      .split("-")
      .map(word => word && word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : "")
      .filter(word => word.length > 0)
      .join(" ");
  };
  
  const inferredDomainName = domainName || pathToDomainName(domainPath || location.pathname);
  
  // Debug logging
  console.log("DomainTemplate Debug:", {
    domainPath,
    locationPathname: location.pathname,
    domainName,
    inferredDomainName,
    domainsLength: domains.length,
    domains: domains.map(d => ({ id: d?.id, name: d?.name }))
  });
  
  // Find domain by name or fallback to mock domain for testing
  const foundDomain = domains.find(dom => 
    dom?.name === domainName || dom?.name === inferredDomainName
  ) || getDomainByName(inferredDomainName);
  
  const selectedDomainObj = foundDomain || {
    id: location.pathname.replace("/", ""),
    name: inferredDomainName || "Test Domain",
    subdomains: [],
    DomainCarouselImages: [
      "https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp",
      "https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp"
    ]
  };
  
  console.log("Selected Domain Object:", selectedDomainObj);
  console.log("Subdomains detail:", selectedDomainObj?.subdomains);
  
  // Ensure safe subdomains array 
  if (selectedDomainObj?.subdomains && Array.isArray(selectedDomainObj.subdomains)) {
    selectedDomainObj.subdomains = selectedDomainObj.subdomains.filter(sub => 
      sub != null && (typeof sub === 'string' || (typeof sub === 'object' && sub.name != null))
    );
    console.log("Filtered subdomains:", selectedDomainObj.subdomains);
  }

  // API state management
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(9); // 9 indicators per page
  const [totalIndicators, setTotalIndicators] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [governanceFilter, setGovernanceFilter] = useState(null);
  const [domainFilter, setDomainFilter] = useState(null);
  const [subdomainFilter, setSubdomainFilter] = useState(null);

  // Domain state
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [,setSelectedDomain] = useState(selectedDomainObj);

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
      try {
        setLoading(true);
        setError(null);
        
        const skip = currentPage * pageSize;
        let data;
        let totalCount = 0;
        
        if (isSearchMode && searchQuery) {
          // Search mode: use search API with sorting and filtering
          data = await indicatorService.search(searchQuery, pageSize, skip, sortBy, sortOrder, governanceFilter, domainFilter, subdomainFilter);
          // For search mode, estimate total based on current results
          const hasMoreData = data.length === pageSize;
          totalCount = hasMoreData ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + data.length;
        } else {
          // Domain mode: wait for domains to load and use domain filtering
          if (domains.length === 0) {
            setLoading(false);
            return;
          }
          
          if (!selectedDomainObj?.id || !selectedDomainObj.id.match(/^[a-fA-F0-9]{24}$/)) {
            setLoading(false);
            return;
          }
          
          // Use parallel API calls to get both indicators and count
          if (selectedSubdomain && selectedSubdomain.name) {
            const subdomainName = typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain.name;
            const [indicatorsData, count] = await Promise.all([
              indicatorService.getBySubdomain(selectedDomainObj.id, subdomainName, skip, pageSize, sortBy, sortOrder, governanceFilter),
              indicatorService.getCountBySubdomain(selectedDomainObj.id, subdomainName, governanceFilter)
            ]);
            data = indicatorsData;
            totalCount = count;
          } else {
            const [indicatorsData, count] = await Promise.all([
              indicatorService.getByDomain(selectedDomainObj.id, skip, pageSize, sortBy, sortOrder, governanceFilter),
              indicatorService.getCountByDomain(selectedDomainObj.id, governanceFilter)
            ]);
            data = indicatorsData;
            totalCount = count;
          }
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error("API returned non-array data:", data);
          setIndicators([]);
          setTotalIndicators(0);
          setLoading(false);
          return;
        }
        
        // Filter out indicators with null names to prevent rendering errors
        const cleanData = data.filter(indicator => 
          indicator && indicator.name != null
        );
        
        console.log("API returned indicators:", cleanData.map(ind => ({ id: ind?.id, name: ind?.name })));
        
        setIndicators(cleanData || []);
        setTotalIndicators(totalCount || 0);
        
        // Determine if there are more pages based on total count
        const hasMore = skip + pageSize < totalCount;
        setHasNextPage(hasMore);
        
      } catch (err) {
        console.error("Failed to load indicators:", err);
        setError(err.message);
        setIndicators([]);
        setTotalIndicators(0);
        setHasNextPage(false);
      } finally {
        setLoading(false);
      }
    };

    loadIndicators();
  }, [selectedDomainObj?.id, selectedSubdomain, currentPage, pageSize, domains, sortBy, sortOrder, governanceFilter, domainFilter, subdomainFilter, isSearchMode, searchQuery]);

  // Reset pagination when subdomain changes
  const handleSubdomainChange = (subdomain) => {
    setSelectedSubdomain(subdomain);
    setCurrentPage(0);
  };

  // Sorting and filtering handlers
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(0); // Reset pagination when sorting
  };

  const handleGovernanceFilter = (value) => {
    setGovernanceFilter(value);
    setCurrentPage(0); // Reset pagination when filtering
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <PageTemplate>
      {!isSearchMode && <Carousel images={images} />}
      <div className="p-4">
        {/* Search Results Header or Domain Navigation */}
        {isSearchMode ? (
          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl shadow-sm border border-primary/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-search text-primary text-lg"></i>
                  <div>
                    <h1 className="text-xl font-bold text-base-content">Search Results</h1>
                    <p className="text-sm text-base-content/70">
                      Results for: <span className="font-semibold text-primary">"{searchQuery}"</span>
                    </p>
                  </div>
                </div>
                <div className="text-sm text-base-content/60">
                  {totalIndicators > 0 ? `${totalIndicators} result${totalIndicators === 1 ? '' : 's'} found` : 'No results found'}
                </div>
              </div>
            </div>
            
            {/* Search Results Sorting and Filtering Controls */}
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-4">
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <i className="fas fa-sort text-primary"></i>
                  <span className="font-semibold text-sm">Sort:</span>
                  <select
                    className="select select-sm select-bordered bg-base-100 border-base-300 focus:border-primary transition-colors"
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="periodicity">Periodicity</option>
                    <option value="favourites">Favourites</option>
                  </select>
                  <button 
                    className="btn btn-sm btn-outline btn-primary hover:btn-primary"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? (
                      <i className="fas fa-sort-alpha-down"></i>
                    ) : (
                      <i className="fas fa-sort-alpha-up"></i>
                    )}
                  </button>
                </div>

                {/* Domain Filter */}
                <div className="flex items-center gap-2">
                  <i className="fas fa-layer-group text-primary"></i>
                  <span className="font-semibold text-sm">Domain:</span>
                  <select
                    className="select select-sm select-bordered bg-base-100 border-base-300 focus:border-primary transition-colors min-w-[120px]"
                    value={domainFilter || ''}
                    onChange={(e) => {
                      setDomainFilter(e.target.value || null);
                      setSubdomainFilter(null); // Reset subdomain when domain changes
                      setCurrentPage(0);
                    }}
                  >
                    <option value="">All Domains</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subdomain Filter */}
                <div className="flex items-center gap-2">
                  <i className="fas fa-sitemap text-primary"></i>
                  <span className="font-semibold text-sm">Subdomain:</span>
                  <select
                    className="select select-sm select-bordered bg-base-100 border-base-300 focus:border-primary transition-colors min-w-[140px]"
                    value={subdomainFilter || ''}
                    onChange={(e) => {
                      setSubdomainFilter(e.target.value || null);
                      setCurrentPage(0);
                    }}
                    disabled={!domainFilter}
                  >
                    <option value="">All Subdomains</option>
                    {domainFilter && domains.find(d => d.id === domainFilter)?.subdomains?.map(subdomain => (
                      <option key={subdomain.name || subdomain} value={subdomain.name || subdomain}>
                        {subdomain.name || subdomain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Governance Filter */}
                <div className="flex items-center gap-2">
                  <i className="fas fa-filter text-secondary"></i>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-secondary"
                      checked={governanceFilter === true}
                      onChange={(e) => {
                        setGovernanceFilter(e.target.checked ? true : null);
                        setCurrentPage(0);
                      }}
                    />
                    <span className="text-sm font-medium text-base-content group-hover:text-secondary transition-colors">
                      Governance only
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Left side: Domain/Subdomain Selection */}
            <div className="flex items-center gap-4">
              <Dropdowns
                selectedDomain={selectedDomainObj}
                setSelectedDomain={setSelectedDomain}
                selectedSubdomain={selectedSubdomain}
                setSelectedSubdomain={handleSubdomainChange}
                showIndicatorDropdown={false}
                redirectOnDomainChange={true}
                allowSubdomainClear={true}
              />
            </div>
            
            {/* Right side: Sorting and Filtering Controls */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Sort Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-base-content">
                  <i className="fas fa-sort text-primary"></i>
                  <span className="font-semibold text-sm">Sort by:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="select select-sm select-bordered bg-base-100 border-base-300 focus:border-primary transition-colors"
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="periodicity">Periodicity</option>
                    <option value="favourites">Favourites</option>
                  </select>
                  <button 
                    className="btn btn-sm btn-outline btn-primary hover:btn-primary"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? (
                      <i className="fas fa-sort-alpha-down"></i>
                    ) : (
                      <i className="fas fa-sort-alpha-up"></i>
                    )}
                  </button>
                </div>
              </div>

              {/* Governance Filter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-base-content">
                  <i className="fas fa-filter text-secondary"></i>
                  <span className="font-semibold text-sm">Filter:</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-secondary"
                    checked={governanceFilter === true}
                    onChange={(e) => {
                      handleGovernanceFilter(e.target.checked ? true : null);
                    }}
                  />
                  <span className="text-sm font-medium group-hover:text-secondary transition-colors">
                    Governance only
                  </span>
                </label>
              </div>

            </div>
          </div>
        )}
      </div>
      
      {loading && <LoadingSkeleton />}
      
      {error && <ErrorDisplay error={error} />}
      
      {!loading && !error && (
        <>
          <div className="flex flex-wrap place-content-center gap-4">
            {indicators
              .filter(indicator => indicator && indicator.name && indicator.id)
              .map((indicator) => (
                <IndicatorCard
                  key={indicator.id}
                  IndicatorTitle={isSearchMode ? highlightSearchTerms(indicator.name, searchQuery) : indicator.name}
                  IndicatorId={indicator.id}
                  GraphTypes={GraphTypes}
                  domain={indicator.domain?.name || selectedDomainObj?.name}
                  subdomain={isSearchMode ? (indicator.subdomain || indicator.domain?.name) : (typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain?.name)}
                />
              ))}
          </div>
          
          {indicators.length === 0 && (
            <div className="text-center p-8">
              <h2 className="text-xl">
                {isSearchMode 
                  ? `No indicators found matching "${searchQuery}"`
                  : selectedSubdomain && (typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain.name)
                    ? `No indicators found for ${typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain.name}` 
                    : `No indicators found for ${selectedDomainObj?.name || inferredDomainName}`}
              </h2>
            </div>
          )}
          
          <Pagination
            currentPage={currentPage}
            totalItems={totalIndicators}
            pageSize={pageSize}
            hasNextPage={hasNextPage}
            onPageChange={handlePageChange}
            loading={loading}
            showItemCount={true}
            itemName="indicators"
          />
        </>
      )}
    </PageTemplate>
  );
}
