import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { useAuth } from "../contexts/AuthContext";

export default function DomainTemplate() {
  const location = useLocation();
  const { domainPath } = useParams();
  const { domainId: stateDomainId, domainName } = location.state || {};
  const { domains, getDomainByName } = useDomain();
  const getName = useLocalizedName();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
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
  
  // Find domain by ID first, then fallback to name match (PT and EN)
  const foundDomain = (stateDomainId && domains.find(dom => dom?.id === stateDomainId))
    || domains.find(dom =>
      dom?.name === domainName || dom?.name === inferredDomainName ||
      dom?.name_en === domainName || dom?.name_en === inferredDomainName
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
  const [pageSize] = useState(12); // 12 indicators per page (3 full rows of 4)
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

  // View mode and search state
  const [viewMode, setViewMode] = useState('grid');
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Domain state
  const [selectedSubdomain, setSelectedSubdomain] = useState(initialSubdomain);
  const [,setSelectedDomain] = useState(selectedDomainObj);
  const navigateTo = useNavigate();

  const images = selectedDomainObj?.DomainCarouselImages?.length > 0
    ? selectedDomainObj.DomainCarouselImages
    : [];

  // Graph icons
  const GraphTypes = [
    { icon: "📊" },
    { icon: "📈" },
    { icon: "📉" },
    { icon: "📈" },
    { icon: "📉" },
  ];

  // Load indicators from API
  const loadIndicators = async () => {
    try {
      setLoading(true);
      setError(null);

      const skip = currentPage * pageSize;
      let data;
      let totalCount = 0;

      if (isSearchMode && searchQuery) {
        // Search mode: use search API with sorting and filtering
        data = await indicatorService.search(searchQuery, pageSize, skip, sortBy, sortOrder, governanceFilter, domainFilter, subdomainFilter, isAdmin);
        const hasMoreData = data.length === pageSize;
        totalCount = hasMoreData ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + data.length;
      } else if (isAllIndicatorsMode) {
        // All Indicators mode
        // Check if we are filtering by domain via dropdown in All Indicators mode
        if (domainFilter) {
           if (subdomainFilter) {
              // Filter by specific subdomain within a domain
              const [indicatorsData, count] = await Promise.all([
                indicatorService.getBySubdomain(domainFilter, subdomainFilter, skip, pageSize, sortBy, sortOrder, governanceFilter, isAdmin),
                indicatorService.getCountBySubdomain(domainFilter, subdomainFilter, governanceFilter, isAdmin)
              ]);
              data = indicatorsData;
              totalCount = count;
           } else {
              // Filter by specific domain
              const [indicatorsData, count] = await Promise.all([
                indicatorService.getByDomain(domainFilter, skip, pageSize, sortBy, sortOrder, governanceFilter, isAdmin),
                indicatorService.getCountByDomain(domainFilter, governanceFilter, isAdmin)
              ]);
              data = indicatorsData;
              totalCount = count;
           }
        } else {
           // No domain filter, get everything
           const [indicatorsData, count] = await Promise.all([
             indicatorService.getAll(skip, pageSize, sortBy, sortOrder, governanceFilter, isAdmin),
             indicatorService.getCount(isAdmin)
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
            indicatorService.getBySubdomain(selectedDomainObj.id, subdomainName, skip, pageSize, sortBy, sortOrder, governanceFilter, isAdmin),
            indicatorService.getCountBySubdomain(selectedDomainObj.id, subdomainName, governanceFilter, isAdmin)
          ]);
          data = indicatorsData;
          totalCount = count;
        } else {
          const [indicatorsData, count] = await Promise.all([
            indicatorService.getByDomain(selectedDomainObj.id, skip, pageSize, sortBy, sortOrder, governanceFilter, isAdmin),
            indicatorService.getCountByDomain(selectedDomainObj.id, governanceFilter, isAdmin)
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

  useEffect(() => {
    loadIndicators();
  }, [selectedDomainObj?.id, selectedSubdomain, currentPage, pageSize, domains, sortBy, sortOrder, governanceFilter, domainFilter, subdomainFilter, isSearchMode, searchQuery, isAllIndicatorsMode, isAdmin]);

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

  // Search handler
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      navigateTo(`/all-indicators?q=${encodeURIComponent(trimmed)}`);
    } else if (isSearchMode) {
      navigateTo('/all-indicators');
    }
  }, [searchInput, isSearchMode, navigateTo]);

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
    <PageTemplate fullBleed>
      <div className="min-h-screen bg-[#f3f4f6] overflow-x-hidden">
        {/* Hero banner — tall image + domain-colored wave + icon */}
        {!isSearchMode && !isAllIndicatorsMode && images.length > 0 && (
          <div className="relative w-full">
            {/* Dark photo background — ends at wave midpoint */}
            <div className="w-full h-[200px] sm:h-[400px] bg-gray-800">
              {images[0] && (
                <img src={images[0]} alt="" className="w-full h-full object-cover opacity-60" />
              )}
            </div>
            {/* Spacer for the bottom half of the wave (below the image) */}
            <div className="w-full h-12 sm:h-24 bg-[#f3f4f6]" />
            {/* Domain-colored wave stroke at bottom of hero */}
            {/* Mobile: wave */}
            <svg
              className="absolute bottom-0 left-[-5%] w-[110%] h-20 sm:hidden"
              viewBox="0 0 433 71"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="domain-mobile-wave" x="0" y="0" width="432.123" height="70.5088" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feMorphology radius="0.652927" operator="dilate" in="SourceAlpha" result="effect1"/>
                  <feOffset/><feGaussianBlur stdDeviation="0.489695"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape"/>
                </filter>
              </defs>
              <g filter="url(#domain-mobile-wave)">
                <path d="M9.59497 26.3733C82.3981 54.3991 127.74 43.7612 190.611 31.5028C280.743 13.9292 338.564 29.4627 426.1 47.1511" stroke={domainColor} strokeWidth="44.329"/>
              </g>
            </svg>
            {/* Desktop: thick wave band */}
            <svg
              className="absolute bottom-0 left-0 w-full h-56 hidden sm:block"
              viewBox="0 0 1512 230"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="domain-wave-shadow" x="-110" y="0" width="1729" height="230" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feMorphology radius="1.46" operator="dilate" in="SourceAlpha" result="effect1"/>
                  <feOffset/><feGaussianBlur stdDeviation="1.1"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape"/>
                </filter>
              </defs>
              <g filter="url(#domain-wave-shadow)">
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
                className="absolute left-4 sm:left-12 bottom-4 sm:bottom-10 bg-white rounded-full p-3 sm:p-5 flex items-center justify-center z-10 w-17 h-17 sm:w-28 sm:h-28 shadow-sm"
              >
                <img src={domainIcon} alt="" className="w-[40px] h-[40px] sm:w-[76px] sm:h-[76px] object-contain" />
              </div>
            )}
          </div>
        )}

        <div className="max-w-[1512px] mx-auto px-4 sm:px-12 pb-20" style={(!isSearchMode && !isAllIndicatorsMode && images.length > 0) ? undefined : { paddingTop: 'calc(var(--navbar-height) + 6rem)' }}>
          {/* Back button + breadcrumbs */}
          {!isSearchMode && !isAllIndicatorsMode && (
            <div className="flex flex-col gap-4 mb-6 pt-8">
              <button
                onClick={() => navigateTo(-1)}
                className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-3 py-1 text-sm font-['Onest'] font-medium text-[#0a0a0a] hover:bg-white/60 shadow-sm w-fit cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('common.back')}
              </button>
              <nav className="flex items-center gap-2 text-base font-['Onest'] text-[#0a0a0a]">
                <Link to="/indicators" className="hover:underline">{t('domains.breadcrumb_dimensions')}</Link>
                <span className="text-gray-400">/</span>
                <span className="underline underline-offset-4">{getName(selectedDomainObj) || inferredDomainName}</span>
              </nav>
            </div>
          )}

          {/* Title + description */}
          <div className="flex flex-col gap-2 sm:gap-4 mb-8 sm:mb-16">
            <h1 className="font-['Onest'] font-semibold text-3xl sm:text-5xl leading-none text-[#0a0a0a] tracking-tight">
              {displayName}
            </h1>
            <p className="font-['Onest'] font-medium text-sm sm:text-lg leading-normal text-[#0a0a0a] max-w-4xl">
              {displayDescription}
            </p>
          </div>

          {/* Stats dashboard — commented out for now
          {!isSearchMode && !isAllIndicatorsMode && (
            <div className="flex flex-col lg:flex-row gap-8 mb-16">
              <div className="bg-[#fffefc] rounded-2xl flex-1 flex flex-col items-center justify-center p-8 gap-8">
                <h2 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight">{t('domains.overall_performance')}</h2>
                <div className="flex flex-col items-center gap-8">
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
                    <span className="ml-auto font-['Onest'] text-xs text-primary">● {stat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          */}

          {/* Todos os Indicadores section */}
          <div className="flex flex-col gap-6">
            <h2 className="font-['Onest'] font-semibold text-2xl sm:text-3xl text-[#0a0a0a] tracking-tight">
              {t('domains.all_indicators')}
            </h2>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
              {/* Left: filters */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto">
                {/* Domain/Subdomain dropdowns */}
                {!isSearchMode && (
                  <Dropdowns
                    selectedDomain={isAllIndicatorsMode ? (domainFilter ? domains.find(d => d.id === domainFilter) : null) : selectedDomainObj}
                    setSelectedDomain={(domain) => {
                      if (isAllIndicatorsMode) {
                        setDomainFilter(domain?.id || null);
                        setSubdomainFilter(null);
                        setCurrentPage(0);
                      } else {
                        setSelectedDomain(domain);
                      }
                    }}
                    selectedSubdomain={isAllIndicatorsMode ? (subdomainFilter ? { name: subdomainFilter } : null) : selectedSubdomain}
                    setSelectedSubdomain={(sub) => {
                      if (isAllIndicatorsMode) {
                        setSubdomainFilter(sub?.name || null);
                        setCurrentPage(0);
                      } else {
                        handleSubdomainChange(sub);
                      }
                    }}
                    redirectOnDomainChange={!isAllIndicatorsMode}
                    allowSubdomainClear={true}
                    allowDomainClear={isAllIndicatorsMode}
                  />
                )}

                {/* Sort */}
                <div ref={sortRef} className="relative">
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="font-['Onest',sans-serif] text-sm text-[#0a0a0a] bg-[#fffefc] border border-[#d4d4d4] rounded-full h-10 px-4 shadow-sm hover:bg-black/[0.02] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-[#0a0a0a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="truncate">
                      {sortBy === 'name' ? t('domains.sort_name') : sortBy === 'periodicity' ? t('domains.sort_periodicity') : t('domains.sort_favorites')}
                    </span>
                    <svg className={`w-4 h-4 text-[#0a0a0a] shrink-0 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSortDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-[#fffefc] rounded-2xl shadow-lg border border-[#e5e5e5] overflow-hidden">
                      {[
                        { value: 'name', label: t('domains.sort_name') },
                        { value: 'periodicity', label: t('domains.sort_periodicity') },
                        { value: 'favourites', label: t('domains.sort_favorites') },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { handleSort(option.value); setIsSortDropdownOpen(false); }}
                          className={`font-['Onest',sans-serif] text-sm w-full text-left px-4 py-2.5 hover:bg-black/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl ${sortBy === option.value ? 'text-primary font-medium' : 'text-[#0a0a0a]'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Governance */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary border-[#d4d4d4] shadow-xs"
                    checked={governanceFilter === true}
                    onChange={(e) => { handleGovernanceFilter(e.target.checked ? true : null); }}
                  />
                  <span className="font-['Onest'] text-sm text-[#0a0a0a]">{t('domains.filter_governance')}</span>
                </label>
              </div>

              {/* Right: view toggle + search */}
              <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                {/* Grid / Table toggle */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border shadow-sm transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-black/[0.03] border-[#d4d4d4]'
                        : 'bg-[#fffefc] border-[#e5e5e5] hover:bg-black/[0.02]'
                    }`}
                    title={t('domains.view_grid')}
                  >
                    <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border shadow-sm transition-colors cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-black/[0.03] border-[#d4d4d4]'
                        : 'bg-[#fffefc] border-[#e5e5e5] hover:bg-black/[0.02]'
                    }`}
                    title={t('domains.view_table')}
                  >
                    <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                    </svg>
                  </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t('domains.search_placeholder')}
                    className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 pl-4 pr-10 w-48 sm:w-72 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>

            {/* Loading / Error */}
            {loading && <LoadingSkeleton />}
            {error && <ErrorDisplay error={error} />}

            {!loading && !error && (
              <>
                {indicators.filter(ind => ind?.name && ind?.id).length > 0 ? (
                  viewMode === 'grid' ? (
                    /* Grid view */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {indicators
                        .filter(ind => ind?.name && ind?.id)
                        .map((indicator) => (
                          <IndicatorCard
                            key={indicator.id}
                            IndicatorTitle={isSearchMode ? highlightSearchTerms(getName(indicator), searchQuery) : getName(indicator)}
                            IndicatorId={indicator.id}
                            domain={
                              (typeof indicator.domain === 'object' ? indicator.domain?.name : domains.find(d => d.id === indicator.domain)?.name)
                              || selectedDomainObj?.name
                            }
                            subdomain={
                              isSearchMode || isAllIndicatorsMode
                                ? (indicator.subdomain || undefined)
                                : (getName(selectedSubdomain) || indicator.subdomain || undefined)
                            }
                            description={getName.field(indicator, 'description', 'description_en')}
                            unit={indicator.unit}
                            hidden={!!indicator.hidden}
                            isAdmin={isAdmin}
                            onToggleHidden={async (e) => {
                              e.stopPropagation();
                              await indicatorService.patch(indicator.id, { hidden: !indicator.hidden });
                              loadIndicators();
                            }}
                          />
                        ))}
                    </div>
                  ) : (
                    /* Table view */
                    <div className="bg-[#fffefc] rounded-2xl overflow-hidden border border-[#e5e5e5]">
                      <table className="w-full font-['Onest']">
                        <thead>
                          <tr className="border-b border-[#e5e5e5] text-left text-sm text-gray-500">
                            <th className="px-6 py-4 font-medium">{t('domains.table_name')}</th>
                            <th className="px-6 py-4 font-medium">{t('domains.table_dimension')}</th>
                            <th className="px-6 py-4 font-medium">{t('domains.table_subdomain')}</th>
                            <th className="px-6 py-4 font-medium">{t('domains.table_unit')}</th>
                            <th className="px-6 py-4 font-medium">{t('domains.filter_governance')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicators
                            .filter(ind => ind?.name && ind?.id)
                            .map((indicator) => {
                              const indDomainName = (typeof indicator.domain === 'object' ? indicator.domain?.name : domains.find(d => d.id === indicator.domain)?.name) || selectedDomainObj?.name;
                              const indDomainObj = domains.find(d => d.name === indDomainName);
                              const indSubdomain = isSearchMode || isAllIndicatorsMode
                                ? (indicator.subdomain || '')
                                : (getName(selectedSubdomain) || indicator.subdomain || '');
                              return (
                                <tr
                                  key={indicator.id}
                                  className={`border-b border-[#f3f4f6] hover:bg-[#f9fafb] cursor-pointer transition-colors ${indicator.hidden ? 'opacity-50' : ''}`}
                                  onClick={() => navigateTo(`/indicator/${indicator.id}`, {
                                    state: { indicatorId: indicator.id, domainName: indDomainName, subdomainName: indSubdomain }
                                  })}
                                >
                                  <td className="px-6 py-4 text-sm font-semibold text-[#0a0a0a]">
                                    {isSearchMode ? highlightSearchTerms(getName(indicator), searchQuery) : getName(indicator)}
                                  </td>
                                  <td className="px-6 py-4">
                                    {indDomainName && (
                                      <span
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                                        style={{ backgroundColor: indDomainObj?.color || '#9ca3af' }}
                                      >
                                        {indDomainName}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{indSubdomain}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{indicator.unit || '—'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{indicator.governance ? t('common.yes') : t('common.no')}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )
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
