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
  const pathToDomainName = (path) => {
    if (!path || typeof path !== 'string') return "";
    // Remove leading /indicators/ or /
    const cleanPath = path.replace(/^\/indicators\//, "").replace(/^\//, "");
    if (!cleanPath || cleanPath === "indicators") return "";
    return cleanPath
      .split("-")
      .map(word => word && word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : "")
      .filter(word => word.length > 0)
      .join(" ");
  };
  
  const inferredDomainName = domainName || pathToDomainName(domainPath || location.pathname);
  const isAllIndicatorsMode = !inferredDomainName && !isSearchMode;

  // Debug logging
  console.log("DomainTemplate Debug:", {
    domainPath,
    locationPathname: location.pathname,
    domainName,
    inferredDomainName,
    isAllIndicatorsMode,
    domainsLength: domains.length,
    domains: domains.map(d => ({ id: d?.id, name: d?.name }))
  });
  
  // Find domain by name or fallback
  const foundDomain = domains.find(dom => 
    dom?.name === domainName || dom?.name === inferredDomainName
  ) || getDomainByName(inferredDomainName);
  
  const selectedDomainObj = foundDomain || (isAllIndicatorsMode ? null : {
    id: location.pathname.replace("/", ""),
    name: inferredDomainName || "Test Domain",
    subdomains: [],
    DomainCarouselImages: []
  });
  
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
          const hasMoreData = data.length === pageSize;
          totalCount = hasMoreData ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + data.length;
        } else if (isAllIndicatorsMode) {
          // All Indicators mode
          // Check if we are filtering by domain via dropdown in All Indicators mode
          if (domainFilter) {
             if (subdomainFilter) {
                // Filter by specific subdomain within a domain
                const [indicatorsData, count] = await Promise.all([
                  indicatorService.getBySubdomain(domainFilter, subdomainFilter, skip, pageSize, sortBy, sortOrder, governanceFilter),
                  indicatorService.getCountBySubdomain(domainFilter, subdomainFilter, governanceFilter)
                ]);
                data = indicatorsData;
                totalCount = count;
             } else {
                // Filter by specific domain
                const [indicatorsData, count] = await Promise.all([
                  indicatorService.getByDomain(domainFilter, skip, pageSize, sortBy, sortOrder, governanceFilter),
                  indicatorService.getCountByDomain(domainFilter, governanceFilter)
                ]);
                data = indicatorsData;
                totalCount = count;
             }
          } else {
             // No domain filter, get everything
             const [indicatorsData, count] = await Promise.all([
               indicatorService.getAll(skip, pageSize, sortBy, sortOrder, governanceFilter),
               indicatorService.getCount()
             ]);
             data = indicatorsData;
             totalCount = count;
          }
        } else {
          // Specific Domain mode (legacy /environment etc or /indicators/environment)
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
  }, [selectedDomainObj?.id, selectedSubdomain, currentPage, pageSize, domains, sortBy, sortOrder, governanceFilter, domainFilter, subdomainFilter, isSearchMode, searchQuery, isAllIndicatorsMode]);

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
      <div className="min-h-screen bg-base-100">
        {/* Hero Section - Matches Home Page Style */}
        <section className="text-center py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {isSearchMode
                ? `Resultados para "${searchQuery}"`
                : selectedDomainObj?.name || (isAllIndicatorsMode ? 'Todos os Indicadores' : inferredDomainName || 'Indicadores')}
            </h1>
            <p className="text-sm md:text-base text-black mb-8 max-w-2xl mx-auto">
              {isSearchMode
                ? `Encontrámos ${indicators.length} indicador${indicators.length !== 1 ? 'es' : ''} que corresponde${indicators.length === 1 ? '' : 'm'} à sua pesquisa.`
                : isAllIndicatorsMode 
                  ? "Explore a lista completa de indicadores de sustentabilidade disponíveis na plataforma."
                  : `Explore os indicadores de sustentabilidade do domínio ${selectedDomainObj?.name || inferredDomainName}.`
              }
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Filters Section - Seamless Style */}
          {(isSearchMode || isAllIndicatorsMode) ? (
            <div className="mb-12">
              <div className="flex flex-col gap-6">
                {/* Header for Filters */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <i className={`fas ${isSearchMode ? 'fa-search' : 'fa-globe'} text-primary text-xl`}></i>
                    <span className="text-lg font-semibold text-gray-700">
                      {totalIndicators > 0 ? `${totalIndicators} Indicadores Disponíveis` : 'Nenhum indicador encontrado'}
                    </span>
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="w-full flex justify-center">
                  <div className="flex flex-wrap items-center gap-6 bg-white p-2 rounded-full border border-gray-200 shadow-sm px-6">
                    {/* Sort Controls */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-600">Ordenar:</span>
                      <select
                        className="select select-sm select-ghost focus:bg-transparent focus:text-primary transition-colors"
                        value={sortBy}
                        onChange={(e) => handleSort(e.target.value)}
                      >
                        <option value="name">Nome</option>
                        <option value="periodicity">Periodicidade</option>
                        <option value="favourites">Favoritos</option>
                      </select>
                      <button 
                        className="btn btn-sm btn-ghost btn-circle text-primary"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
                      >
                        {sortOrder === 'asc' ? (
                          <i className="fas fa-sort-alpha-down"></i>
                        ) : (
                          <i className="fas fa-sort-alpha-up"></i>
                        )}
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* Domain Filter */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-600">Domínio:</span>
                      <select
                        className="select select-sm select-ghost focus:bg-transparent focus:text-primary transition-colors min-w-[120px]"
                        value={domainFilter || ''}
                        onChange={(e) => {
                          setDomainFilter(e.target.value || null);
                          setSubdomainFilter(null); // Reset subdomain when domain changes
                          setCurrentPage(0);
                        }}
                      >
                        <option value="">Todos</option>
                        {domains.map(domain => (
                          <option key={domain.id} value={domain.id}>
                            {domain.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* Subdomain Filter */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-600">Dimensão:</span>
                      <select
                        className="select select-sm select-ghost focus:bg-transparent focus:text-primary transition-colors min-w-[140px]"
                        value={subdomainFilter || ''}
                        onChange={(e) => {
                          setSubdomainFilter(e.target.value || null);
                          setCurrentPage(0);
                        }}
                        disabled={!domainFilter}
                      >
                        <option value="">Todos</option>
                        {domainFilter && domains.find(d => d.id === domainFilter)?.subdomains?.map(subdomain => (
                          <option key={subdomain.name || subdomain} value={subdomain.name || subdomain}>
                            {subdomain.name || subdomain}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* Governance Filter */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary"
                          checked={governanceFilter === true}
                          onChange={(e) => {
                            setGovernanceFilter(e.target.checked ? true : null);
                            setCurrentPage(0);
                          }}
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                          Governança
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-12 pb-6 border-b border-gray-200">
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
                <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-200 shadow-sm px-4">
                  <span className="font-semibold text-sm text-gray-600">Ordenar:</span>
                  <div className="flex items-center gap-2">
                    <select
                      className="select select-sm select-ghost focus:bg-transparent focus:text-primary transition-colors"
                      value={sortBy}
                      onChange={(e) => handleSort(e.target.value)}
                    >
                      <option value="name">Nome</option>
                      <option value="periodicity">Periodicidade</option>
                      <option value="favourites">Favoritos</option>
                    </select>
                    <button 
                      className="btn btn-sm btn-ghost btn-circle text-primary"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
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
                <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-200 shadow-sm px-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={governanceFilter === true}
                      onChange={(e) => {
                        handleGovernanceFilter(e.target.checked ? true : null);
                      }}
                    />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                      Governança
                    </span>
                  </label>
                </div>

              </div>
            </div>
          )}
        
        {loading && <LoadingSkeleton />}
        
        {error && <ErrorDisplay error={error} />}
        
        {!loading && !error && (
          <>
            {/* Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                    description={indicator.description}
                    unit={indicator.unit}
                  />
                ))}
            </div>

            {/* Empty State */}
            {indicators.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2 font-['Onest',sans-serif]">
                  Nenhum indicador encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  {isSearchMode
                    ? `Não encontrámos indicadores correspondentes a "${searchQuery}". Tente ajustar os termos de pesquisa.`
                    : selectedSubdomain && (typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain.name)
                      ? `Não existem indicadores disponíveis para ${typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain.name}.`
                      : `Não existem indicadores disponíveis para ${selectedDomainObj?.name || inferredDomainName}.`}
                </p>
                {isSearchMode && (
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Voltar atrás
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalItems={totalIndicators}
                pageSize={pageSize}
                hasNextPage={hasNextPage}
                onPageChange={handlePageChange}
                loading={loading}
                showItemCount={true}
                itemName="indicadores"
              />
            </div>
          </>
        )}
        </div>
      </div>
    </PageTemplate>
  );
}
