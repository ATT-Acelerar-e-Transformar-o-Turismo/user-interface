import { useNavigate, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useIndicator } from "../contexts/IndicatorContext";
import { useAuth } from "../contexts/AuthContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns";
import GChart from "../components/Chart";
import Views from "../components/Views";
import indicatorService from "../services/indicatorService";
import { useState, useEffect, useCallback, useRef } from "react";

import useIndicatorData from "../hooks/useIndicatorData";

export default function IndicatorTemplate() {
  const navigate = useNavigate();
  const { indicatorId } = useParams();
  const { domains } = useDomain();
  const { user, isAuthenticated } = useAuth();
  const indicatorChartRef = useRef(null);

  const { getIndicatorById, loading } = useIndicator();

  // UI State for filters (not applied yet)
  const [uiStartDate, setUiStartDate] = useState('');
  const [uiEndDate, setUiEndDate] = useState('');
  const [uiGranularity, setUiGranularity] = useState('0');

  // Debug: Log when component mounts with scroll functionality
  console.log('🚀 IndicatorTemplate mounted with horizontal scroll functionality for:', indicatorId);

  // Applied State for fetching (triggers hook)
  const [fetchParams, setFetchParams] = useState({
    granularity: '0',
    startDate: null,
    endDate: null,
    limit: 100 // Limit to last 100 datapoints
  });

  // Move the hook to the top level, before any conditional returns
  const { data: chartData, loading: dataLoading } = useIndicatorData(indicatorId, "Indicator Data", fetchParams);
  
  const [indicatorData, setIndicatorData] = useState(null);
  const [error, setError] = useState(null);
  const [indicatorLoading, setIndicatorLoading] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allLoadedData, setAllLoadedData] = useState(null); // Store all loaded data chunks
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewport, setViewport] = useState({ min: null, max: null });

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  const handleViewportChange = useCallback((newViewport) => {
    // Update viewport state for export consistency and potential data loading triggers
    if (newViewport.min !== viewport.min || newViewport.max !== viewport.max) {
        setViewport(newViewport);
    }
  }, [viewport.min, viewport.max]);

  // Auto-apply filters when UI values change
  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(0);
    setAllLoadedData(null);
    setIsLoadingMore(false);
    setViewport({ min: null, max: null }); // Reset viewport state
    setFetchParams({
      granularity: uiGranularity,
      startDate: uiStartDate ? new Date(uiStartDate).toISOString() : null,
      endDate: uiEndDate ? new Date(uiEndDate).toISOString() : null,
      limit: 100
    });
    // After first user interaction, disable animations
    if (!isInitialLoad) {
      // This is a filter change, not initial load
    }
  }, [uiGranularity, uiStartDate, uiEndDate, isInitialLoad]);

  // Track when data loads for the first time
  useEffect(() => {
    if (chartData && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [chartData, isInitialLoad]);

  // Handle new data chunks and merge with existing data
  useEffect(() => {
    if (chartData) {
      setAllLoadedData(prevData => {
        if (!prevData) {
          // First load - replace all data
          setIsLoadingMore(false);
          return chartData;
        } else {
          // Merge new data with existing data, removing duplicates
          const mergedData = {
            ...chartData,
            series: chartData.series.map((newSeries, seriesIndex) => {
              const prevSeries = prevData.series[seriesIndex];
              if (!prevSeries) return newSeries;

              // Combine data and remove duplicates based on x (time) value
              const existingDataMap = new Map(
                prevSeries.data.map(point => [new Date(point.x).getTime(), point])
              );

              // Add new data points, overwriting duplicates
              newSeries.data.forEach(point => {
                existingDataMap.set(new Date(point.x).getTime(), point);
              });

              // Convert back to array and sort by date
              const combinedData = Array.from(existingDataMap.values())
                .sort((a, b) => new Date(a.x) - new Date(b.x));

              return {
                ...newSeries,
                data: combinedData
              };
            })
          };
          setIsLoadingMore(false);
          return mergedData;
        }
      });
    }
  }, [chartData]);

  // Safety check: if loading finishes and no data came back, reset loading state
  useEffect(() => {
    if (!dataLoading && isLoadingMore && !chartData) {
      console.log('📉 Data fetch completed with no results. Resetting loading state.');
      setIsLoadingMore(false);
    }
  }, [dataLoading, isLoadingMore, chartData]);

  // Effect to load more data when viewport approaches earliest data
  useEffect(() => {
    // Only fetch if data exists, not already loading, and viewport min is approaching earliest data
    if (viewport.min && allLoadedData?.series?.[0]?.data?.length > 1 && !dataLoading && !isLoadingMore) {
        const earliestDataPoint = allLoadedData.series[0].data[0];
        const earliestDataTime = new Date(earliestDataPoint.x).getTime();
        const visibleStartTime = new Date(viewport.min).getTime();

        const binSize = allLoadedData.series[0].data[1].x - earliestDataPoint.x;
        const loadMargin = binSize * 20;

        if (visibleStartTime < earliestDataTime + loadMargin) {
            console.log('TRIGGERING LOAD MORE DATA:', { visibleStartTime, earliestDataTime, loadMargin });
            setIsLoadingMore(true);
            setFetchParams(prev => ({
                ...prev,
                startDate: null, // Allow fetching older data without lower bound
                endDate: earliestDataTime.toISOString(),
                limit: 100
            }));
        }
    }
  }, [viewport.min, allLoadedData, dataLoading, isLoadingMore]);

  const handleResetFilters = () => {
    setUiStartDate('');
    setUiEndDate('');
    setUiGranularity('0');
    setCurrentPage(0);
    setAllLoadedData(null);
    setIsLoadingMore(false);
    setViewport({ min: null, max: null }); // Reset viewport state
    setFetchParams({
      granularity: '0',
      startDate: null,
      endDate: null,
      limit: 100
    });
  };

  // Export functionality
  const handleExportCSV = () => {
    if (!chartData?.series?.[0]?.data) return;

    const csvContent = [
      ['Date', 'Value'],
      ...chartData.series[0].data.map(point => [point.x, point.y])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicatorData?.name || 'indicator'}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportImage = async () => {
    try {
      // Use the tracked viewport state for "What You See Is What You Get" export
      let exportStartDate = fetchParams.startDate;
      let exportEndDate = fetchParams.endDate;
      
      if (viewport.min && viewport.max) {
         exportStartDate = new Date(viewport.min).toISOString();
         exportEndDate = new Date(viewport.max).toISOString();
      }

      const exportPayload = {
        chart_type: chartType,
        theme: 'light',
        width: 1200,
        height: 600,
        granularity: fetchParams.granularity,
        start_date: exportStartDate,
        end_date: exportEndDate,
        title: indicatorData?.name || 'Indicator',
        xaxis_type: 'datetime',
        colors: ['#009367', '#084d92', '#00d1b2', '#3abff8'],
        annotations: { xaxis: [], yaxis: [] }
      };

      const blob = await indicatorService.exportChartImage(indicatorId, exportPayload);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${indicatorData?.name || 'indicator'}_chart.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      
      // Try to read the blob error message
      if (error.response && error.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          console.error('Export error details:', reader.result);
        };
        reader.readAsText(error.response.data);
      }
      
      alert('Falha ao exportar imagem. Por favor tente novamente.');
    }
  };

  const fallbackImageExport = () => {
    const chartElement = document.querySelector('.apexcharts-canvas svg');
    console.log('🖼️ Chart element found:', !!chartElement);

    if (chartElement) {
      console.log('🖼️ Using fallback SVG export method');
      const svgData = new XMLSerializer().serializeToString(chartElement);
      console.log('🖼️ SVG data length:', svgData.length);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        console.log('🖼️ Image loaded successfully, dimensions:', img.width, 'x', img.height);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/png');
        console.log('🖼️ Canvas dataURL created, length:', dataURL.length);

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `${indicatorData?.name || 'indicator'}_chart.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('🖼️ Download triggered');
      };

      img.onerror = (error) => {
        console.error('🖼️ Image load failed:', error);
      };

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      img.src = svgUrl;
      console.log('🖼️ Image src set to:', svgUrl);
    } else {
      console.error('🖼️ No chart found for export');
    }
  };

  const handleCopyReference = () => {
    const reference = `${window.location.origin}/indicator/${indicatorId}`;
    navigator.clipboard.writeText(reference);
    alert('Referência copiada para a área de transferência!');
  };

  const handleEditInformation = () => {
    navigate(`/indicator/${indicatorId}/edit`);
  };

  const handleAddSources = () => {
    navigate(`/indicator/${indicatorId}/sources/add`);
  };

  const handleSourceExportCSV = (sourceName) => {
    if (!chartData?.series?.[0]?.data) return;

    const csvContent = [
      ['Date', 'Value', 'Source'],
      ...chartData.series[0].data.map(point => [point.x, point.y, sourceName])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sourceName}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSourceView = (sourceName) => {
    // Optional: Implement server-side filtering by source if API supports it, 
    // or client-side filtering on the current 'chartData'.
    // For now, we'll just log it as the old logic was removed.
    console.log('Filtering by source not fully implemented yet:', sourceName);
  };

  const handleSourceDelete = (sourceName) => {
    if (window.confirm('Tem a certeza que pretende eliminar esta fonte? Esta ação não pode ser desfeita.')) {
      console.log('Deleting source:', sourceName);
      window.location.reload();
    }
  };

  // Fetch indicator data from API (must be declared before any returns)
  useEffect(() => {
    const fetchIndicatorData = async () => {
      try {
        setIndicatorLoading(true);
        const data = await indicatorService.getById(indicatorId);
        setIndicatorData(data);
      } catch (err) {
        console.error("Failed to fetch indicator data:", err);
        setError(err.message);
      } finally {
        setIndicatorLoading(false);
      }
    };

    if (indicatorId) {
      fetchIndicatorData();
    }
  }, [indicatorId]);

  // Show loading state while indicators are being loaded
  if (loading) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </PageTemplate>
    );
  }


  // Add loading state while domains are being fetched
  if (!domains || domains.length === 0) {
    return <div>Loading domains...</div>;
  }

  if (indicatorLoading) {
    return <div>Loading indicator...</div>;
  }

  if (error || !indicatorData) {
    return <div>Error: {error || 'Indicator not found'}</div>;
  }

  // Find domain information based on indicator data
  let resolvedDomainObj = indicatorData.domain ? 
    (typeof indicatorData.domain === 'object' ? indicatorData.domain : 
     domains.find(domain => domain.id === indicatorData.domain)) : null;

  // Ensure subdomains are in consistent object format { name: "subdomain" }
  if (resolvedDomainObj && resolvedDomainObj.subdomains) {
    resolvedDomainObj = {
      ...resolvedDomainObj,
      subdomains: resolvedDomainObj.subdomains.map(subdomain => 
        typeof subdomain === 'string' ? { name: subdomain } : subdomain
      )
    };
  }

  console.log('IndicatorTemplate - Domain resolution:', {
    indicatorDataDomain: indicatorData.domain,
    resolvedDomainObj,
    subdomains: resolvedDomainObj?.subdomains,
    subdomainTypes: resolvedDomainObj?.subdomains?.map(sub => typeof sub)
  });

  // Debug logging removed for cleaner output

  if (!resolvedDomainObj) {
    return <div>Domain not found for indicator.</div>;
  }

  const resolvedSubdomainName = indicatorData.subdomain || 'Unknown Subdomain';

  // Find subdomain object - all subdomains should now be objects with name property
  const subdomainObj = resolvedDomainObj.subdomains?.find((sub) => sub.name === resolvedSubdomainName);
  
  if (!subdomainObj) {
    console.warn('Subdomain not found in domain subdomains:', {
      resolvedSubdomainName,
      availableSubdomains: resolvedDomainObj.subdomains
    });
    // Create a mock subdomain object instead of failing
    // This allows the component to render while debugging
  }

  // Try to find indicator in subdomain, but don't fail if not found
  // This is expected since we're using API data
  // The user sees this domain/subdomain/indicator on screen
  // until they pick a new indicator in the dropdown.

  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    navigate(`/indicator/${newIndicator.id}`, {
      state: {
        domainName: newDomain.name,
        subdomainName: typeof newSubdomain === 'string' ? newSubdomain : newSubdomain.name,
        indicatorId: newIndicator.id,
      },
    });
  };

  const images = resolvedDomainObj.DomainCarouselImages || [];

  // Transform real data to chart format
  const realCharts = [
    {
      chartType: 'line',
      xaxisType: 'datetime',
      group: 'indicator',
      availableFilters: [],
      activeFilters: [],
      annotations: {
        xaxis: [],
        yaxis: []
      },
      series: chartData?.series || []
    }
  ];

  return (
    <PageTemplate>
      <div className="min-h-screen bg-base-100">
        {/* Hero Section - Matches Home Page Style */}
        <section className="text-center pt-20 pb-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight font-['Onest',sans-serif]">
              {indicatorData.name}
            </h1>
            <p className="text-sm md:text-base text-black mb-8 max-w-2xl mx-auto leading-relaxed">
              {indicatorData.description || `Explore os dados e a evolução do indicador ${indicatorData.name}.`}
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-7xl px-4 pb-12">
          {/* Navigation/Breadcrumb Section */}
          <div className="p-4 border-b border-base-300 mb-8">
            {resolvedDomainObj && (
              <IndicatorDropdowns
                currentDomain={resolvedDomainObj}
                currentSubdomain={subdomainObj || { name: resolvedSubdomainName }}
                currentIndicator={indicatorData}
                onIndicatorChange={handleIndicatorChange}
                allowSubdomainClear={false}
              />
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Left Side - Chart Area */}
            <div className="flex-1 min-h-0">
              <div className="bg-base-200 p-8 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-base-content/70">
                    Última atualização: {new Date().toLocaleDateString('pt-PT')}
                  </div>
                  <div className="flex items-center gap-4">
                    <Views
                      size="sm"
                      activeView={chartType}
                      onViewChange={setChartType}
                    />
                  </div>
                </div>

                <div className="h-[600px] relative">
                  {/* Loading spinner in top-right corner when loading */}
                  {dataLoading && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="loading loading-spinner loading-sm text-primary"></div>
                    </div>
                  )}

                  {/* Chart - always show if data exists */}
                  {(allLoadedData || chartData)?.series?.[0]?.data?.length > 0 ? (
                    <div className="h-full">
                      <GChart
                        ref={indicatorChartRef}
                        chartId={`indicator-${indicatorId}`}
                        chartType={chartType}
                        xaxisType="datetime"
                        series={((allLoadedData || chartData)?.series || []).map(s => ({
                          ...s,
                          name: indicatorData?.name || s.name
                        }))}
                        height="100%"
                        showToolbar={true}
                        showLegend={true}
                        themeMode="light"
                        disableAnimations={!isInitialLoad}
                        onViewportChange={handleViewportChange}
                      />
                    </div>
                  ) : (
                    /* Empty state - only show if no data AND not loading initial data */
                    !dataLoading ? (
                      <div className="absolute inset-0 flex justify-center items-center bg-gray-50 rounded-xl">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="text-xl font-medium text-gray-900 mb-2">Dados não disponíveis</div>
                          <div className="text-gray-500">Este indicador ainda não possui dados para visualização.</div>
                        </div>
                      </div>
                    ) : (
                      /* Show loading spinner in center only for initial load when no previous data */
                      <div className="absolute inset-0 flex justify-center items-center bg-gray-50/50 rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                          <div className="loading loading-spinner loading-lg text-primary"></div>
                          <div className="text-sm text-gray-500">Carregando dados...</div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Tools Panel */}
            <div className="w-full xl:w-72 space-y-3">
              {/* Ferramentas Panel */}
              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-base-content">Ferramentas</h3>

                <div className="space-y-4">
                  {/* Granularity Selector */}
                  <div>
                    <label className="text-xs font-medium text-base-content/80 mb-2 block">Granularidade</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Raw', value: '0' },
                        { label: 'Dia', value: '1d' },
                        { label: 'Sem', value: '1w' },
                        { label: 'Mês', value: '1M' },
                        { label: 'Ano', value: '1y' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setUiGranularity(option.value)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            uiGranularity === option.value
                              ? 'bg-primary text-primary-content border-primary'
                              : 'bg-white border-base-300 text-base-content hover:bg-base-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">Início</span>
                    <input
                      type="date"
                      value={uiStartDate}
                      onChange={(e) => setUiStartDate(e.target.value)}
                      className="w-32 px-2 py-1 text-sm bg-white border border-base-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">Fim</span>
                    <input
                      type="date"
                      value={uiEndDate}
                      onChange={(e) => setUiEndDate(e.target.value)}
                      className="w-32 px-2 py-1 text-sm bg-white border border-base-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="w-full px-3 py-2 bg-white border border-base-300 text-base-content text-sm rounded hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Opções Panel */}
              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-base-content">Opções</h3>

                <div className="space-y-3">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-start gap-3 p-3 bg-white border border-base-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-base-content/80">Exportar CSV</span>
                  </button>

                  <button
                    onClick={handleExportImage}
                    className="w-full flex items-center justify-start gap-3 p-3 bg-white border border-base-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-base-content/80">Exportar como imagem</span>
                  </button>

                  <button
                    onClick={handleCopyReference}
                    className="w-full flex items-center justify-start gap-3 p-3 bg-white border border-base-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-base-content/80">Copiar Referência</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Information and Sources */}
        <div className="px-6 pb-6 space-y-6">
          {/* Informações sobre o Indicador */}
          <div className="bg-base-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-base-content">Informações sobre o Indicador</h3>
              {isAdmin && (
                <button
                  onClick={handleEditInformation}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                >
                  Editar Informações
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {indicatorData.description && (
              <p className="text-base-content/90 mb-4 text-sm leading-relaxed">{indicatorData.description}</p>
            )}

            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium text-base-content/80">Fonte(s): </span>
                <span className="text-base-content">{indicatorData.characteristics?.source || indicatorData.font || indicatorData.source || "INE"}</span>
              </div>
              <div>
                <span className="font-medium text-base-content/80">Escala: </span>
                <span className="text-base-content">N/A</span>
              </div>
              <div>
                <span className="font-medium text-base-content/80">Unidades: </span>
                <span className="text-base-content">{indicatorData.characteristics?.unit_of_measure || indicatorData.unit_of_measure || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-base-content/80">Periodicidade: </span>
                <span className="text-base-content">{indicatorData.characteristics?.periodicity || indicatorData.periodicity || "Anual"}</span>
              </div>
              <div>
                <span className="font-medium text-base-content/80">Governança: </span>
                <span className="text-base-content">Sim</span>
              </div>
              <div>
                <span className="font-medium text-base-content/80">Dimensão: </span>
                <span className="text-base-content">{resolvedDomainObj?.name || ""}</span>
              </div>
              <div>
                <span className="font-medium text-base-content/80">Domínio: </span>
                <span className="text-base-content">{resolvedSubdomainName || ""}</span>
              </div>
            </div>
          </div>

          {/* Fontes do Indicador */}
          <div className="bg-base-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-base-content">Fontes do Indicador (1)</h3>
              {isAdmin && (
                <button
                  onClick={handleAddSources}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                >
                  Adicionar Fontes
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sources Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-left py-3 px-4 font-medium text-base-content/60">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-base-content/60">Domínio</th>
                    <th className="text-left py-3 px-4 font-medium text-base-content/60">Periodicidade</th>
                    <th className="text-left py-3 px-4 font-medium text-base-content/60">Opções</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-base-300/50">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <svg className="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-base-content">qualidade_ar_indicador.csv</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-base-content">2019-2025</td>
                    <td className="py-3 px-4 text-sm text-base-content">2019-2025</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* Export CSV */}
                        <button
                          onClick={() => handleSourceExportCSV('qualidade_ar_indicador.csv')}
                          className="text-base-content/40 hover:text-primary transition-colors"
                          title="Exportar CSV"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>

                        {/* View/Filter Chart */}
                        <button
                          onClick={() => handleSourceView('qualidade_ar_indicador.csv')}
                          className="text-base-content/40 hover:text-success transition-colors"
                          title="Mostrar apenas dados desta fonte no gráfico"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Delete (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleSourceDelete('qualidade_ar_indicador.csv')}
                            className="text-base-content/40 hover:text-error transition-colors"
                            title="Eliminar fonte (apenas administradores)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
