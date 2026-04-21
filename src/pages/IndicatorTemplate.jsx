import { useNavigate, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useAuth } from "../contexts/AuthContext";
import resourceService from "../services/resourceService";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns";
import GChart from "../components/Chart";
import ResourceWizard from "../components/wizard/ResourceWizard";
import IndicatorWizard from "../components/wizard/IndicatorWizard";
import indicatorService from "../services/indicatorService";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

import useIndicatorData from "../hooks/useIndicatorData";
import useLocalizedName from "../hooks/useLocalizedName";
import { useTranslation } from "react-i18next";

export default function IndicatorTemplate() {
  const navigate = useNavigate();
  const { indicatorId } = useParams();
  const { domains } = useDomain();
  const { user, isAuthenticated } = useAuth();
  const indicatorChartRef = useRef(null);

  const getName = useLocalizedName();
  const { t } = useTranslation();

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
  const [infoOpen, setInfoOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [indicatorResources, setIndicatorResources] = useState([]);
  const [sourcesError, setSourcesError] = useState(null);
  const [isResourceWizardOpen, setIsResourceWizardOpen] = useState(false);
  const [isIndicatorWizardOpen, setIsIndicatorWizardOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [showSourceDetailsModal, setShowSourceDetailsModal] = useState(false);
  const chartDropdownRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(e.target)) setChartDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chartTypeOptions = [
    { value: 'line', label: t('indicator.chart_line', 'Linha'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 21H6.2C5.08 21 4.52 21 4.09 20.782C3.72 20.59 3.41 20.284 3.22 19.908C3 19.48 3 18.92 3 17.8V3M7 15L12 9L16 13L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { value: 'column', label: t('indicator.chart_column', 'Colunas'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 10V19M16 7V19M8 14V19M4 5V19C4 19.552 4.448 20 5 20H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { value: 'bar', label: t('indicator.chart_bar', 'Barras'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" transform="rotate(90) matrix(-1,0,0,1,0,0)"><path d="M21 21H6.2C5.08 21 4.52 21 4.09 20.782C3.72 20.59 3.41 20.284 3.22 19.908C3 19.48 3 18.92 3 17.8V3M7 10.5V17.5M11.5 5.5V17.5M16 10.5V17.5M20.5 5.5V17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { value: 'scatter', label: t('indicator.chart_scatter', 'Dispersão'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 21H7.8C6.12 21 5.28 21 4.638 20.673C4.074 20.385 3.615 19.927 3.327 19.362C3 18.72 3 17.88 3 16.2V3M9.5 8.5H9.51M19.5 7.5H19.51M14.5 12.5H14.51M8.5 15.5H8.51M18.5 15.5H18.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

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
    // Try client-side export first via ApexCharts
    const chartInstance = indicatorChartRef.current?.chart;
    if (chartInstance) {
      try {
        const { imgURI } = await chartInstance.dataURI({ scale: 2 });
        const a = document.createElement('a');
        a.href = imgURI;
        a.download = `${indicatorData?.name || 'indicator'}_chart.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (e) {
        console.warn('Client-side chart export failed, trying server:', e);
      }
    }

    // Fallback to server-side export
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
        colors: ['#084d92', '#009368', '#00d1b2', '#3abff8'],
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

      alert(t('indicator.export_image_error'));
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
    alert(t('indicator.reference_copied'));
  };

  const handleEditInformation = () => {
    setIsIndicatorWizardOpen(true);
  };

  const handleAddSources = () => {
    setIsResourceWizardOpen(true);
  };

  const refreshIndicatorResources = async () => {
    try {
      const fresh = await indicatorService.getById(indicatorId);
      setIndicatorData(fresh);
    } catch (err) {
      console.error('Failed to refresh indicator after resource change:', err);
    }
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

  const handleSourceView = async (resource) => {
    setSelectedResource(resource);
    setSelectedFilePreview(null);
    setPreviewError(null);
    setShowSourceDetailsModal(true);
    if (!resource?.wrapper_id) {
      setPreviewError(t('indicator.no_preview_available', 'Pré-visualização indisponível para esta fonte.'));
      return;
    }
    setPreviewLoading(true);
    try {
      const wrapper = await resourceService.getWrapper(resource.wrapper_id);
      const fileId = wrapper?.source_config?.file_id;
      if (!fileId) {
        setPreviewError(t('indicator.preview_only_for_files', 'Pré-visualização apenas disponível para fontes CSV/XLSX.'));
        return;
      }
      const fileInfo = await resourceService.getFileInfo(fileId);
      setSelectedFilePreview(fileInfo);
    } catch (err) {
      console.error('Failed to load source preview:', err);
      setPreviewError(t('indicator.preview_load_failed', 'Falha ao carregar a pré-visualização.'));
    } finally {
      setPreviewLoading(false);
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

  useEffect(() => {
    let cancelled = false;
    const fetchResources = async () => {
      if (!indicatorData?.resources?.length) {
        setIndicatorResources([]);
        setSourcesError(null);
        return;
      }
      const results = await Promise.all(
        indicatorData.resources.map(id =>
          resourceService.getById(id).then(
            r => ({ ok: true, resource: r }),
            err => ({ ok: false, id, err })
          )
        )
      );
      if (cancelled) return;
      const loaded = results.filter(r => r.ok).map(r => r.resource);
      const failed = results.filter(r => !r.ok);
      setIndicatorResources(loaded);
      if (failed.length) {
        console.error('Failed to load some resources:', failed);
        setSourcesError(
          loaded.length
            ? `Failed to load ${failed.length} of ${results.length} source(s).`
            : 'Failed to load sources. The resource service may be unreachable.'
        );
      } else {
        setSourcesError(null);
      }
    };
    fetchResources();
    return () => { cancelled = true; };
  }, [indicatorData?.resources]);

  if (indicatorLoading) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </PageTemplate>
    );
  }

  if (!domains || domains.length === 0) {
    return <div>{t('indicator.loading_domains')}</div>;
  }

  if (indicatorLoading) {
    return <div>{t('indicator.loading_indicator')}</div>;
  }

  if (error || !indicatorData) {
    return <div>{error || t('indicator.not_found')}</div>;
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
    return <div>{t('indicator.domain_not_found')}</div>;
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

  const images = resolvedDomainObj.DomainCarouselImages?.length > 0
    ? resolvedDomainObj.DomainCarouselImages
    : [];

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

  const domainColor = resolvedDomainObj?.DomainColor || resolvedDomainObj?.color || '#C3F25E';
  const domainIcon = resolvedDomainObj?.DomainIcon;
  const domainPath = resolvedDomainObj?.name
    ? `/indicators/${resolvedDomainObj.name.toLowerCase().replace(/\s+/g, '-')}`
    : '/indicators';


  const cardClass = "bg-[#fffefc] rounded-lg p-4 shadow-[0_0_3px_rgba(0,0,0,0.05)]";

  return (
    <PageTemplate fullBleed>
      <div className="min-h-screen bg-[#f3f4f6] overflow-x-hidden">
        {/* Hero banner */}
        <div className="relative w-full">
          <div className="w-full h-[200px] sm:h-[400px] bg-gray-800">
            {images[0] && <img src={images[0]} alt="" className="w-full h-full object-cover opacity-60" />}
          </div>
          <div className="w-full h-12 sm:h-24 bg-[#f3f4f6]" />
          {/* Mobile: wave */}
          <svg
            className="absolute bottom-0 left-[-5%] w-[110%] h-20 sm:hidden"
            viewBox="0 0 433 71"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="indicator-mobile-wave" x="0" y="0" width="432.123" height="70.5088" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
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
            <g filter="url(#indicator-mobile-wave)">
              <path d="M9.59497 26.3733C82.3981 54.3991 127.74 43.7612 190.611 31.5028C280.743 13.9292 338.564 29.4627 426.1 47.1511" stroke={domainColor} strokeWidth="44.329"/>
            </g>
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-full h-56 hidden sm:block"
            viewBox="0 0 1512 230"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="indicator-wave-shadow" x="-110" y="0" width="1729" height="230" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
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
            <g filter="url(#indicator-wave-shadow)">
              <path
                d="M-56.7861 98.2787C105.288 132.099 121.652 141.321 293.331 107.848C468.398 73.7143 641.792 88.1376 762.805 119.016C1016 183.621 1352.56 229.014 1565.73 53.2341"
                stroke={domainColor}
                strokeWidth="99.1626"
                strokeLinecap="round"
              />
            </g>
          </svg>
          {domainIcon && (
            <div className="absolute left-4 sm:left-12 bottom-4 sm:bottom-10 bg-white rounded-full p-3 sm:p-5 flex items-center justify-center z-10 w-17 h-17 sm:w-28 sm:h-28 shadow-sm">
              <img src={domainIcon} alt="" className="w-10 h-10 sm:w-19 sm:h-19 object-contain" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-[1512px] mx-auto px-4 sm:px-12 pb-18">
          {/* Back button */}
          <div className="pt-6 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-3 py-1 text-sm font-['Onest'] font-medium text-[#0a0a0a] hover:bg-white/60 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.back')}
            </button>
          </div>

          {/* Indicator navigation dropdowns */}
          {resolvedDomainObj && (
            <div className="mb-6">
              <IndicatorDropdowns
                currentDomain={resolvedDomainObj}
                currentSubdomain={subdomainObj || { name: resolvedSubdomainName }}
                currentIndicator={indicatorData}
                onIndicatorChange={handleIndicatorChange}
                allowSubdomainClear={false}
              />
            </div>
          )}

          <div className="space-y-6">
            {/* Chart + Sidebar row */}
            <div className="flex flex-col xl:flex-row gap-6">
            {/* Chart card */}
            <div className={`${cardClass} flex-1 min-w-0`}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <h2 className="font-['Onest'] font-semibold text-2xl xl:text-3xl text-[#0a0a0a] tracking-tight leading-tight">
                  {getName(indicatorData)} {indicatorData.unit ? `(${indicatorData.unit})` : ''}
                </h2>
                <div ref={chartDropdownRef} className="relative shrink-0">
                  <button
                    onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                    className="text-[#0a0a0a] bg-[#fffefc] border border-[#d4d4d4] rounded-lg p-2 shadow-sm hover:bg-black/[0.02] transition-colors flex items-center gap-1 cursor-pointer"
                    title={chartTypeOptions.find(o => o.value === chartType)?.label}
                  >
                    {chartTypeOptions.find(o => o.value === chartType)?.icon}
                    <svg className={`w-3.5 h-3.5 text-[#0a0a0a] shrink-0 transition-transform ${chartDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {chartDropdownOpen && (
                    <div className="absolute z-50 mt-2 right-0 bg-[#fffefc] rounded-2xl shadow-lg border border-[#e5e5e5] overflow-hidden">
                      {chartTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setChartType(option.value); setChartDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.03] transition-colors first:rounded-t-2xl last:rounded-b-2xl cursor-pointer whitespace-nowrap ${chartType === option.value ? 'text-primary bg-black/[0.02]' : 'text-[#0a0a0a]'}`}
                          title={option.label}
                        >
                          {option.icon}
                          <span className="font-['Onest'] text-sm">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-72 sm:h-96 xl:h-[550px] relative">
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
                        name: getName(indicatorData) || s.name
                      }))}
                      height="100%"
                      showToolbar={true}
                      showLegend={true}
                      themeMode="light"
                      disableAnimations={!isInitialLoad}
                      onViewportChange={handleViewportChange}
                      xaxisRange={viewport.min != null && viewport.max != null ? viewport : null}
                    />
                  </div>
                ) : !dataLoading ? (
                  <div className="absolute inset-0 flex justify-center items-center rounded-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="text-xl font-medium text-[#0a0a0a] mb-2">{t('indicator.no_data_title')}</div>
                      <div className="text-[#737373]">{t('indicator.no_data_description')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="loading loading-spinner loading-lg text-primary"></div>
                      <div className="text-sm text-[#737373]">{t('indicator.loading_data')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Ferramentas + Opções */}
            <div className="w-full xl:w-84 shrink-0 space-y-6">
            {/* Ferramentas (Tools) card */}
            <div className={cardClass}>
              <div className="flex flex-col gap-4">
                <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">
                  {t('indicator.tools')}
                </h3>

                <div className="space-y-4">
                  {/* Date range */}
                  <div>
                    <p className="font-['Onest'] font-medium text-sm text-[#0a0a0a] mb-2">{t('indicator.granularity')}:</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        <span className="font-['Onest'] text-sm text-[#0a0a0a] w-6">{t('indicator.start_date_short', 'De')}</span>
                        <input
                          type="date"
                          value={uiStartDate}
                          onChange={(e) => setUiStartDate(e.target.value)}
                          className="font-['Onest'] flex-1 px-2 py-1.5 text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-['Onest'] text-sm text-[#0a0a0a] w-6">{t('indicator.end_date_short', 'Até')}</span>
                        <input
                          type="date"
                          value={uiEndDate}
                          onChange={(e) => setUiEndDate(e.target.value)}
                          className="font-['Onest'] flex-1 px-2 py-1.5 text-sm bg-[#fffefc] border border-[#e5e5e5] rounded-lg shadow-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interval selector */}
                  <div>
                    <p className="font-['Onest'] font-medium text-sm text-[#0a0a0a] mb-2">{t('indicator.interval', 'Intervalo')}:</p>
                    <div className="flex">
                      {[
                        { label: t('indicator.granularity_day'), value: '1d' },
                        { label: t('indicator.granularity_month'), value: '1M' },
                        { label: t('indicator.granularity_year'), value: '1y' },
                      ].map((option, i, arr) => (
                        <button
                          key={option.value}
                          onClick={() => setUiGranularity(option.value)}
                          className={`font-['Onest'] font-medium text-sm px-3 py-2 border border-[#e5e5e5] -ml-px first:ml-0 transition-colors cursor-pointer
                            ${i === 0 ? 'rounded-l-lg' : ''} ${i === arr.length - 1 ? 'rounded-r-lg' : ''}
                            ${uiGranularity === option.value ? 'bg-black/[0.03] border-[#d4d4d4] text-[#0a0a0a]' : 'bg-transparent text-[#0a0a0a]'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={handleResetFilters}
                  className="w-full font-['Onest'] font-medium text-base text-[#0a0a0a] border border-[#d4d4d4] rounded-full py-2 shadow-sm hover:bg-black/[0.02] transition-colors cursor-pointer"
                >
                  {t('indicator.reset_filters')}
                </button>
              </div>
            </div>

            {/* Opções (Options) card */}
            <div className={cardClass}>
              <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight mb-4">
                {t('common.options')}
              </h3>
              <div className="space-y-2">
                {[
                  { action: handleExportCSV, label: t('indicator.export_csv'), icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { action: handleExportImage, label: t('indicator.export_image'), icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
                  { action: handleCopyReference, label: t('indicator.copy_reference'), icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" },
                  { action: async () => { if (navigator.share) { try { await navigator.share({ url: window.location.href }); } catch { handleCopyReference(); } } else handleCopyReference(); }, label: t('indicator.share', 'Partilhar'), icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="flex items-center gap-4 w-full py-1 cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <div className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded-lg shadow-sm shrink-0">
                      <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <span className="font-['Onest'] text-sm text-[#0a0a0a]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            </div>{/* end sidebar */}
            </div>{/* end chart + sidebar row */}

            {/* Sobre o indicador (About) — accordion */}
            <div className={cardClass}>
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">
                  {t('indicator.info_title')}
                </h3>
                <svg className={`w-7 h-7 text-[#0a0a0a] transition-transform ${infoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {infoOpen && (
                <div className="mt-4 space-y-4">
                  {isAdmin && (
                    <button
                      onClick={handleEditInformation}
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                    >
                      {t('indicator.edit_info')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {indicatorData.description && (
                    <p className="font-['Onest'] text-sm text-[#0a0a0a] leading-relaxed">
                      {getName.field(indicatorData, 'description', 'description_en')}
                    </p>
                  )}
                  <div className="font-['Onest'] text-sm text-[#0a0a0a] space-y-6">
                    <p><span className="font-semibold">{t('indicator.sources_label')}</span> {indicatorData.font || "N/A"}</p>
                    <p><span className="font-semibold">{t('indicator.scale_label')}</span> {indicatorData.scale || "N/A"}</p>
                    <p><span className="font-semibold">{t('indicator.units_label')}</span> {indicatorData.unit || "N/A"}</p>
                    <p><span className="font-semibold">{t('indicator.periodicity_label')}</span> {indicatorData.periodicity || "N/A"}</p>
                    <p><span className="font-semibold">{t('indicator.governance_label')}</span> {indicatorData?.governance ? t('common.yes') : t('common.no')}</p>
                    <p><span className="font-semibold">{t('indicator.dimension_label')}</span> {getName(resolvedDomainObj)}</p>
                    <p><span className="font-semibold">{t('indicator.domain_label')}</span> {resolvedSubdomainName || ""}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fontes do Indicador (Sources) — accordion */}
            <div className={cardClass}>
              <button
                onClick={() => setSourcesOpen(!sourcesOpen)}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">
                  {t('indicator.sources_title')} ({indicatorResources.length})
                </h3>
                <svg className={`w-7 h-7 text-[#0a0a0a] transition-transform ${sourcesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sourcesOpen && (
                <div className="mt-4">
                  {isAdmin && (
                    <button
                      onClick={handleAddSources}
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer mb-4"
                    >
                      {t('indicator.add_sources')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                  {sourcesError && (
                    <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded text-sm text-error">
                      {sourcesError}
                    </div>
                  )}
                  {indicatorResources.length === 0 && !sourcesError ? (
                    <div className="text-center py-8 text-[#737373]">
                      <p>{t('indicator.no_sources')}</p>
                    </div>
                  ) : indicatorResources.length === 0 ? null : (
                    <div className="overflow-x-auto">
                      <table className="w-full font-['Onest']">
                        <thead>
                          <tr className="border-b border-[#e5e5e5]">
                            <th className="text-left py-3 px-4 font-medium text-sm text-[#737373]">{t('indicator.col_name')}</th>
                            <th className="text-left py-3 px-4 font-medium text-sm text-[#737373]">{t('indicator.col_start_period')}</th>
                            <th className="text-left py-3 px-4 font-medium text-sm text-[#737373]">{t('indicator.col_end_period')}</th>
                            <th className="text-left py-3 px-4 font-medium text-sm text-[#737373]">{t('common.options')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicatorResources.map((resource) => (
                            <tr key={resource.id} className="border-b border-[#f3f4f6]">
                              <td className="py-3 px-4 text-sm text-[#0a0a0a]">{resource.name}</td>
                              <td className="py-3 px-4 text-sm text-[#0a0a0a]">
                                {resource.startPeriod ? new Date(resource.startPeriod).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-[#0a0a0a]">
                                {resource.endPeriod ? new Date(resource.endPeriod).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleSourceExportCSV(resource.name)} className="text-[#737373] hover:text-primary transition-colors cursor-pointer" title={t('indicator.export_csv')}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  </button>
                                  <button onClick={() => handleSourceView(resource)} className="text-[#737373] hover:text-success transition-colors cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ResourceWizard
        isOpen={isResourceWizardOpen}
        onClose={() => setIsResourceWizardOpen(false)}
        indicatorId={indicatorId}
        onSuccess={refreshIndicatorResources}
      />
      <IndicatorWizard
        key="indicator-wizard"
        isOpen={isIndicatorWizardOpen}
        onClose={() => setIsIndicatorWizardOpen(false)}
        indicatorId={indicatorId}
        onSuccess={refreshIndicatorResources}
      />
      {showSourceDetailsModal && selectedResource && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              {t('indicator.source_preview', 'Pré-visualização da Fonte')}: {selectedResource.name}
            </h3>
            {previewLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            ) : previewError ? (
              <div className="p-4 bg-warning/10 border border-warning/30 rounded text-sm">
                {previewError}
              </div>
            ) : selectedFilePreview ? (
              <div className="space-y-3">
                <div className="text-sm text-[#737373]">
                  <strong>{selectedFilePreview.filename}</strong>
                  {selectedFilePreview.file_size != null && (
                    <span> — {(selectedFilePreview.file_size / 1024).toFixed(1)} KB</span>
                  )}
                </div>
                <pre className="bg-base-300 text-base-content p-4 rounded-lg text-xs font-mono overflow-auto max-h-96 whitespace-pre">
                  {selectedFilePreview.preview_data || t('indicator.preview_empty', '(sem dados)')}
                </pre>
              </div>
            ) : null}
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowSourceDetailsModal(false);
                  setSelectedResource(null);
                  setSelectedFilePreview(null);
                  setPreviewError(null);
                }}
              >
                {t('common.close', 'Fechar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
