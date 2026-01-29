import { useNavigate, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useIndicator } from "../contexts/IndicatorContext";
import { useResource } from "../contexts/ResourceContext";
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
  const { resources } = useResource();

  const [uiStartDate, setUiStartDate] = useState('');
  const [uiEndDate, setUiEndDate] = useState('');
  const [uiGranularity, setUiGranularity] = useState('0');

  const [fetchParams, setFetchParams] = useState({
    granularity: '0',
    startDate: null,
    endDate: null,
    limit: 100
  });

  const { data: chartData, loading: dataLoading } = useIndicatorData(indicatorId, "Indicator Data", fetchParams);
  
  const [indicatorData, setIndicatorData] = useState(null);
  const [error, setError] = useState(null);
  const [indicatorLoading, setIndicatorLoading] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allLoadedData, setAllLoadedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewport, setViewport] = useState({ min: null, max: null });

  const isAdmin = user?.role === 'admin';

  const handleViewportChange = useCallback((newViewport) => {
    if (newViewport.min !== viewport.min || newViewport.max !== viewport.max) {
        setViewport(newViewport);
    }
  }, [viewport.min, viewport.max]);

  useEffect(() => {
    setCurrentPage(0);
    setAllLoadedData(null);
    setIsLoadingMore(false);
    setViewport({ min: null, max: null });
    setFetchParams({
      granularity: uiGranularity,
      startDate: uiStartDate ? new Date(uiStartDate).toISOString() : null,
      endDate: uiEndDate ? new Date(uiEndDate).toISOString() : null,
      limit: 100
    });
  }, [uiGranularity, uiStartDate, uiEndDate, isInitialLoad]);

  useEffect(() => {
    if (chartData && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [chartData, isInitialLoad]);

  useEffect(() => {
    if (chartData) {
      setAllLoadedData(prevData => {
        if (!prevData) {
          setIsLoadingMore(false);
          return chartData;
        } else {
          const mergedData = {
            ...chartData,
            series: chartData.series.map((newSeries, seriesIndex) => {
              const prevSeries = prevData.series[seriesIndex];
              if (!prevSeries) return newSeries;

              const existingDataMap = new Map(
                prevSeries.data.map(point => [new Date(point.x).getTime(), point])
              );

              newSeries.data.forEach(point => {
                existingDataMap.set(new Date(point.x).getTime(), point);
              });

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

  useEffect(() => {
    if (!dataLoading && isLoadingMore && !chartData) {
      console.log('📉 Data fetch completed with no results. Resetting loading state.');
      setIsLoadingMore(false);
    }
  }, [dataLoading, isLoadingMore, chartData]);

  useEffect(() => {
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
    setViewport({ min: null, max: null });
    setFetchParams({
      granularity: '0',
      startDate: null,
      endDate: null,
      limit: 100
    });
  };

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
    console.log('Filtering by source:', sourceName);
  };

  const handleSourceDelete = (sourceName) => {
    if (window.confirm('Tem a certeza que pretende eliminar esta fonte? Esta ação não pode ser desfeita.')) {
      console.log('Deleting source:', sourceName);
      window.location.reload();
    }
  };

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

  if (loading) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </PageTemplate>
    );
  }

  if (!domains || domains.length === 0) {
    return <div>Loading domains...</div>;
  }

  if (indicatorLoading) {
    return <div>Loading indicator...</div>;
  }

  if (error || !indicatorData) {
    return <div>Error: {error || 'Indicator not found'}</div>;
  }

  let resolvedDomainObj = indicatorData.domain ?
    (typeof indicatorData.domain === 'object' ? indicatorData.domain :
     domains.find(domain => domain.id === indicatorData.domain)) : null;

  if (resolvedDomainObj && resolvedDomainObj.subdomains) {
    resolvedDomainObj = {
      ...resolvedDomainObj,
      subdomains: resolvedDomainObj.subdomains.map(subdomain => 
        typeof subdomain === 'string' ? { name: subdomain } : subdomain
      )
    };
  }

  if (!resolvedDomainObj) {
    return <div>Domain not found for indicator.</div>;
  }

  const resolvedSubdomainName = indicatorData.subdomain || 'Unknown Subdomain';

  const subdomainObj = resolvedDomainObj.subdomains?.find((sub) => sub.name === resolvedSubdomainName);

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

          <div className="flex flex-col xl:flex-row gap-4">
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
                  {dataLoading && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="loading loading-spinner loading-sm text-primary"></div>
                    </div>
                  )}

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

            <div className="w-full xl:w-72 space-y-3">
              <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-base-content">Ferramentas</h3>

                <div className="space-y-4">
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

        <div className="px-6 pb-6 space-y-6">
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
                <span className="text-base-content">{indicatorData?.governance ? "Sim" : "Não"}</span>
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

          <div className="bg-base-200 p-6">
            {(() => {
              const indicatorResources = indicatorData?.resources
                ? resources.filter(r =>
                    indicatorData.resources.includes(r.id) &&
                    (r.startPeriod || r.endPeriod)
                  )
                : [];
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-base-content">
                      Fontes do Indicador ({indicatorResources.length})
                    </h3>
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

                  {indicatorResources.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Nenhuma fonte associada a este indicador</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-base-300">
                            <th className="text-left py-3 px-4 font-medium text-base-content/60">Nome</th>
                            <th className="text-left py-3 px-4 font-medium text-base-content/60">Período Início</th>
                            <th className="text-left py-3 px-4 font-medium text-base-content/60">Período Fim</th>
                            <th className="text-left py-3 px-4 font-medium text-base-content/60">Opções</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicatorResources.map((resource) => (
                            <tr key={resource.id} className="border-b border-base-300/50">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <svg className="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm text-base-content">{resource.name}</span>
                              </td>
                              <td className="py-3 px-4 text-sm text-base-content">
                                {resource.startPeriod ? new Date(resource.startPeriod).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-base-content">
                                {resource.endPeriod ? new Date(resource.endPeriod).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSourceExportCSV(resource.name)}
                                    className="text-base-content/40 hover:text-primary transition-colors"
                                    title="Exportar CSV"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </button>

                                  <button
                                    onClick={() => handleSourceView(resource.name)}
                                    className="text-base-content/40 hover:text-success transition-colors"
                                    title="Mostrar apenas dados desta fonte no gráfico"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>

                                  {isAdmin && (
                                    <button
                                      onClick={() => handleSourceDelete(resource.name)}
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
