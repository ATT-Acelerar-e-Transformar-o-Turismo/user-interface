import { useNavigate, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useIndicator } from "../contexts/IndicatorContext";
import { useAuth } from "../contexts/AuthContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns";
import Indicator from "../components/Indicator";
import indicatorService from "../services/indicatorService";
import { useState, useEffect } from "react";

import useIndicatorData from "../hooks/useIndicatorData";

export default function IndicatorTemplate() {
  const navigate = useNavigate();
  const { indicatorId } = useParams(); // Extract from URL params
  const { domains } = useDomain();
  const { user, isAuthenticated } = useAuth();

  const { getIndicatorById, loading } = useIndicator();

  // Move the hook to the top level, before any conditional returns
  const { data: chartData, loading: dataLoading } = useIndicatorData(indicatorId, "Indicator Data");
  const [indicatorData, setIndicatorData] = useState(null);
  const [error, setError] = useState(null);
  const [indicatorLoading, setIndicatorLoading] = useState(false);
  const [filteredChartData, setFilteredChartData] = useState(null);
  const [startDate, setStartDate] = useState('2019');
  const [endDate, setEndDate] = useState('2025');

  // Check if current user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator';

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

  const handleExportImage = () => {
    const chartElement = document.querySelector('.apexcharts-canvas svg');
    if (chartElement) {
      const svgData = new XMLSerializer().serializeToString(chartElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${indicatorData?.name || 'indicator'}_chart.png`;
        a.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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
    console.log('Filtering chart to show only:', sourceName);
    setFilteredChartData({
      ...chartData,
      series: chartData.series.map(serie => ({
        ...serie,
        hidden: serie.name !== sourceName
      }))
    });
  };

  const handleSourceDelete = (sourceName) => {
    if (window.confirm('Tem a certeza que pretende eliminar esta fonte? Esta ação não pode ser desfeita.')) {
      console.log('Deleting source:', sourceName);
      window.location.reload();
    }
  };

  const filterDataByDateRange = (data, start, end) => {
    if (!data?.series?.[0]?.data) return data;

    const startYear = parseInt(start);
    const endYear = parseInt(end);

    const filteredSeries = data.series.map(serie => ({
      ...serie,
      data: serie.data.filter(point => {
        const pointDate = new Date(point.x);
        const pointYear = pointDate.getFullYear();
        return pointYear >= startYear && pointYear <= endYear;
      })
    }));

    return {
      ...data,
      series: filteredSeries
    };
  };

  const applyDateFilter = () => {
    if (chartData) {
      const filtered = filterDataByDateRange(chartData, startDate, endDate);
      setFilteredChartData(filtered);
    }
  };

  const resetDateFilter = () => {
    setFilteredChartData(null);
    setStartDate('2019');
    setEndDate('2025');
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
      series: (filteredChartData || chartData)?.series || []
    }
  ];

  return (
    <PageTemplate>
      <Carousel images={images} />

      <div className="container mx-auto max-w-7xl px-4">
        {/* Navigation/Breadcrumb Section */}
        <div className="p-4 border-b border-base-300">
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
        <div className="p-6">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Left Side - Chart Area */}
            <div className="flex-1 min-h-0">
              <div className="bg-base-100 p-4">
                <h2 className="text-xl font-bold mb-4">{indicatorData.name}</h2>

                <div className="h-80">
                  {dataLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="loading loading-spinner loading-lg"></div>
                    </div>
                   ) : chartData?.series?.[0]?.data?.length > 0 ? (
                    <Indicator charts={realCharts} />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <div className="text-center text-base-content/60">
                        <div className="text-xl mb-2">No data available</div>
                        <div className="text-sm">This indicator does not have any data yet.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Tools Panel */}
            <div className="w-full xl:w-72 space-y-3">
              {/* Ferramentas Panel */}
              <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 p-6">
                <h3 className="text-lg font-semibold mb-4 text-base-content">Ferramentas</h3>

                {/* Time Range Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">Início</span>
                    <input
                      type="number"
                      min="2015"
                      max="2030"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-20 px-2 py-1 text-sm bg-base-100 border border-base-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-base-content/80">Fim</span>
                    <input
                      type="number"
                      min="2015"
                      max="2030"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-20 px-2 py-1 text-sm bg-base-100 border border-base-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={applyDateFilter}
                      className="flex-1 px-3 py-2 bg-primary text-primary-content text-sm rounded hover:bg-primary/90 transition-colors"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={resetDateFilter}
                      className="px-3 py-2 bg-base-300 text-base-content text-sm rounded hover:bg-base-300/80 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Opções Panel */}
              <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 p-6">
                <h3 className="text-lg font-semibold mb-4 text-base-content">Opções</h3>

                <div className="space-y-3">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-base-content/80">Exportar CSV</span>
                  </button>

                  <button
                    onClick={handleExportImage}
                    className="w-full flex items-center justify-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-base-content/80">Exportar como imagem</span>
                  </button>

                  <button
                    onClick={handleCopyReference}
                    className="w-full flex items-center justify-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors"
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
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
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
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
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
