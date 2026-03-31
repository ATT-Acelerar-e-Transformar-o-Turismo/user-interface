import { useState, useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";
import Pagination from "../components/Pagination";
import indicatorService from "../services/indicatorService";
import { highlightSearchTerms } from "../utils/searchUtils";
import useLocalizedName from "../hooks/useLocalizedName";
import { useTranslation } from "react-i18next";

export default function DomainTemplate() {
  const location = useLocation();
  const { domainPath } = useParams();
  const { domainName } = location.state || {};
  const { domains, getDomainByName } = useDomain();
  const getName = useLocalizedName();
  const { t } = useTranslation();
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
  
  const inferredDomainName = domainName || (location.pathname === '/all-indicators' ? '' : pathToDomainName(domainPath || location.pathname));
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
  const initialSubdomainName = searchParams.get('subdomain') || location.state?.subdomain || null;
  const initialSubdomain = initialSubdomainName ? { name: initialSubdomainName } : null;
  const [subdomainFilter, setSubdomainFilter] = useState(initialSubdomainName);

  // Domain state
  const [selectedSubdomain, setSelectedSubdomain] = useState(initialSubdomain);
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
            // Domains still loading — keep spinner, effect will re-run when domains arrive
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

  const domainColor = selectedDomainObj?.DomainColor || selectedDomainObj?.color || '#C3F25E';
  const domainIcon = selectedDomainObj?.DomainIcon;
  const displayName = isSearchMode
    ? t('domains.search_results_for', { query: searchQuery })
    : getName(selectedDomainObj) || (isAllIndicatorsMode ? t('domains.all_indicators') : inferredDomainName || t('domains.indicators'));
  const displayDescription = isSearchMode
    ? t('domains.search_results_description', { count: indicators.length })
    : isAllIndicatorsMode
      ? t('domains.all_indicators_description')
      : t('domains.domain_description', { name: (selectedDomainObj?.name || inferredDomainName || '').toLowerCase() });

  return (
    <PageTemplate>
      <div className="min-h-screen bg-[#f3f4f6]">
        {/* Hero banner — tall image + domain-colored wave + icon */}
        {!isSearchMode && !isAllIndicatorsMode && (
          <div className="relative w-full" style={{ marginTop: 'calc(-1 * (var(--navbar-height) + 6rem))' }}>
            {/* Dark photo background — ends at wave midpoint */}
            <div className="w-full h-[400px] bg-gray-800">
              {images[0] && (
                <img src={images[0]} alt="" className="w-full h-full object-cover opacity-60" />
              )}
            </div>
            {/* Spacer for the bottom half of the wave (below the image) */}
            <div className="w-full h-[100px] bg-[#f3f4f6]" />
            {/* Domain-colored wave stroke at bottom of hero */}
            <svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 1512 230"
              fill="none"
              preserveAspectRatio="none"
              style={{ height: '230px' }}
            >
              <defs>
                <filter id="wave-shadow" x="-110" y="0" width="1729" height="230" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feMorphology radius="1.46" operator="dilate" in="SourceAlpha" result="effect1"/>
                  <feOffset/>
                  <feGaussianBlur stdDeviation="1.1"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape"/>
                </filter>
              </defs>
              <g filter="url(#wave-shadow)">
                <path
                  d="M-56.7861 98.2787C105.288 132.099 121.652 141.321 293.331 107.848C468.398 73.7143 641.792 88.1376 762.805 119.016C1016 183.621 1352.56 229.014 1565.73 53.2341"
                  stroke={domainColor}
                  strokeWidth="99.1626"
                  strokeLinecap="round"
                />
              </g>
            </svg>
            {/* Domain icon — overlapping the wave/content boundary */}
            {domainIcon && (
              <div
                className="absolute left-12 bg-white rounded-full p-5 flex items-center justify-center z-10"
                style={{
                  bottom: '40px',
                  width: '112px',
                  height: '112px',
                  boxShadow: `0 0 8px rgba(0,0,0,0.05)`,
                }}
              >
                <img src={domainIcon} alt="" className="w-[76px] h-[76px] object-contain" />
              </div>
            )}
          </div>
        )}

        <div className="max-w-[1512px] mx-auto px-12 pb-20">
          {/* Back button + breadcrumbs */}
          {!isSearchMode && !isAllIndicatorsMode && (
            <div className="flex flex-col gap-4 mb-6 pt-8">
              <Link
                to="/indicators"
                className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-3 py-1 text-sm font-['Onest'] font-medium text-[#0a0a0a] hover:bg-white/60 shadow-sm w-fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('common.back')}
              </Link>
              <nav className="flex items-center gap-2 text-base font-['Onest'] text-[#0a0a0a]">
                <Link to="/indicators" className="hover:underline">{t('domains.breadcrumb_dimensions')}</Link>
                <span className="text-gray-400">/</span>
                <span className="underline underline-offset-4">{getName(selectedDomainObj) || inferredDomainName}</span>
              </nav>
            </div>
          )}

          {/* Title + description */}
          <div className="flex flex-col gap-4 mb-16">
            <h1 className="font-['Onest'] font-semibold text-5xl leading-none text-[#0a0a0a] tracking-tight">
              {displayName}
            </h1>
            <p className="font-['Onest'] font-medium text-lg leading-normal text-[#0a0a0a] max-w-4xl">
              {displayDescription}
            </p>
          </div>

          {/* Stats dashboard — placeholder structure */}
          {!isSearchMode && !isAllIndicatorsMode && (
            <div className="flex flex-col lg:flex-row gap-8 mb-16">
              {/* Left: Desempenho Geral */}
              <div className="bg-[#fffefc] rounded-2xl flex-1 flex flex-col items-center justify-center p-8 gap-8">
                <h2 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight">{t('domains.overall_performance')}</h2>
                <div className="flex flex-col items-center gap-8">
                  {/* Gauge placeholder */}
                  <div className="w-64 h-32 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-t-full opacity-30" />
                  <div className="flex items-center gap-4">
                    <span className="font-['Onest'] font-semibold text-5xl text-[#0a0a0a]">—</span>
                    <span className="font-['Onest'] font-semibold text-5xl text-[#0a0a0a]">/</span>
                    <span className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a]">100</span>
                  </div>
                  <span className="bg-[#cef1aa] text-[#0a0a0a] font-['Onest'] font-medium text-sm rounded-full px-4 py-1">
                    {t('domains.insufficient_data')}
                  </span>
                </div>
              </div>
              {/* Right: 3 stat cards */}
              <div className="flex flex-col gap-4 lg:w-96 shrink-0">
                {[
                  { label: t('domains.stat_available_indicators'), value: `${totalIndicators}`, status: t('domains.stat_active') },
                  { label: t('domains.stat_subdomains'), value: `${selectedDomainObj?.subdomains?.length || 0}`, status: t('domains.stat_active') },
                  { label: t('domains.stat_governance'), value: `${indicators.filter(i => i.governance).length}`, status: t('domains.stat_active') },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#fffefc] rounded-2xl px-6 py-5 flex items-center gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)]">
                    <div className="w-10 h-10 rounded-lg bg-[#f3f4f6] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Onest'] text-sm text-gray-500">{stat.label}</span>
                      <span className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a]">{stat.value}</span>
                    </div>
                    <span className="ml-auto font-['Onest'] text-xs text-[#009368]">● {stat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Todos os Indicadores section */}
          <div className="flex flex-col gap-6">
            <h2 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight">
              {t('domains.all_indicators')}
            </h2>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Domain/Subdomain dropdowns for specific domain mode */}
                {!isSearchMode && !isAllIndicatorsMode && (
                  <Dropdowns
                    selectedDomain={selectedDomainObj}
                    setSelectedDomain={setSelectedDomain}
                    selectedSubdomain={selectedSubdomain}
                    setSelectedSubdomain={handleSubdomainChange}
                    redirectOnDomainChange={true}
                    allowSubdomainClear={true}
                  />
                )}

                {/* Domain filter for all indicators mode */}
                {isAllIndicatorsMode && (
                  <select
                    className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 px-4 text-sm shadow-sm"
                    value={domainFilter || ''}
                    onChange={(e) => { setDomainFilter(e.target.value || null); setSubdomainFilter(null); setCurrentPage(0); }}
                  >
                    <option value="">{t('domains.filter_all_domains')}</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{getName(d)}</option>)}
                  </select>
                )}

                {/* Sort */}
                <div className="flex items-center gap-2 bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 px-4 shadow-sm">
                  <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="font-['Onest'] text-sm text-[#0a0a0a]">{t('domains.sort')}</span>
                  <select
                    className="font-['Onest'] bg-transparent text-sm outline-none cursor-pointer"
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <option value="name">{t('domains.sort_name')}</option>
                    <option value="periodicity">{t('domains.sort_periodicity')}</option>
                    <option value="favourites">{t('domains.sort_favorites')}</option>
                  </select>
                </div>

                {/* Governance */}
                <label className="flex items-center gap-2 bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 px-4 shadow-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={governanceFilter === true}
                    onChange={(e) => { handleGovernanceFilter(e.target.checked ? true : null); }}
                  />
                  <span className="font-['Onest'] text-sm text-[#0a0a0a]">{t('domains.filter_governance')}</span>
                </label>
              </div>

              {/* Search */}
              {isSearchMode && (
                <div className="relative">
                  <input
                    type="text"
                    defaultValue={searchQuery}
                    placeholder={t('domains.search_placeholder')}
                    className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 pl-4 pr-10 w-64 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009368]/30"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Loading / Error */}
            {loading && <LoadingSkeleton />}
            {error && <ErrorDisplay error={error} />}

            {!loading && !error && (
              <>
                {/* Indicator cards — 4-column grid */}
                {indicators.filter(ind => ind?.name && ind?.id).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {indicators
                      .filter(ind => ind?.name && ind?.id)
                      .map((indicator) => (
                        <IndicatorCard
                          key={indicator.id}
                          IndicatorTitle={isSearchMode ? highlightSearchTerms(getName(indicator), searchQuery) : getName(indicator)}
                          IndicatorId={indicator.id}
                          domain={indicator.domain?.name || selectedDomainObj?.name}
                          subdomain={isSearchMode ? (indicator.subdomain || getName(indicator.domain)) : (getName(selectedSubdomain) || undefined)}
                          description={getName.field(indicator, 'description', 'description_en')}
                          unit={indicator.unit}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <h3 className="font-['Onest'] text-2xl font-semibold text-[#0a0a0a] mb-2">
                      {t('domains.no_indicators_found')}
                    </h3>
                    <p className="font-['Onest'] text-gray-600">
                      {isSearchMode
                        ? t('domains.no_indicators_search', { query: searchQuery })
                        : getName(selectedSubdomain)
                          ? t('domains.no_indicators_subdomain', { name: getName(selectedSubdomain) })
                          : t('domains.no_indicators_domain', { name: getName(selectedDomainObj) || inferredDomainName })}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalIndicators}
                    pageSize={pageSize}
                    hasNextPage={hasNextPage}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showItemCount={true}
                    itemName={t('domains.item_name_indicators')}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
