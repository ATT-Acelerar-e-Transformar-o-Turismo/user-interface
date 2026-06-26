import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { LuX, LuChartLine, LuChartColumn, LuChartBar, LuSquarePen } from 'react-icons/lu';
import GChart from '../Chart';
import SourcePill from './SourcePill';
import IndicatorResourcesTab from './IndicatorResourcesTab';
import PanelErrorBoundary from '../PanelErrorBoundary';
import useSlideOver from '../../hooks/useSlideOver';
import indicatorService from '../../services/indicatorService';
import dataService from '../../services/dataService';
import { buildChartSeries } from '../../utils/chartSeries';
import { CHART_TYPE_LABEL_KEYS } from '../../constants/chartTypes';

// Right-half indicator visualization panel (Figma node 2892:15525):
// header (name, unit · área · fonte), tabs (Visão geral / Dados / Configuração),
// chart preview + sync row + description, footer (Fechar / Editar Indicador).
export default function IndicatorDetailPanel({ indicator, source = null, onClose, onEdit }) {
  const { t, i18n } = useTranslation();
  const id = indicator?.id;

  const [full, setFull] = useState(indicator || null);
  const [rawSeries, setRawSeries] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewType, setPreviewType] = useState(null);
  const resolvedSource = source;
  const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [requestClose]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const ind = await indicatorService.getById(id);
        if (!cancelled && ind) {
          setFull(ind);
          setPreviewType(ind.default_chart_type || (ind.chart_types && ind.chart_types[0]) || 'column');
        }
      } catch { /* keep the list copy */ }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingChart(true);
        // Use the per-resource/per-column series endpoint (same as the public
        // page) so multi-column resources render as separate lines instead of
        // every column's points collapsing onto one zig-zagging series.
        const s = await dataService.getIndicatorSeries(id, { limit: 1000, granularity: 'auto' });
        if (cancelled) return;
        setRawSeries(Array.isArray(s) ? s : []);
      } catch { if (!cancelled) setRawSeries([]); }
      finally { if (!cancelled) setLoadingChart(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Hooks must run before any early return. Build the per-column chart series
  // (same path as the public page) and derive the latest data timestamp.
  const lang = i18n.language?.startsWith('en') ? 'en' : 'pt';
  const chartData = useMemo(
    () => buildChartSeries(rawSeries, [], full?.series_translations || null, lang),
    [rawSeries, full?.series_translations, lang],
  );
  const latestPointX = useMemo(() => {
    let max = null;
    for (const s of (chartData?.series || [])) {
      for (const p of (s.data || [])) {
        if (typeof p.x === 'number' && (max === null || p.x > max)) max = p.x;
      }
    }
    return max;
  }, [chartData]);

  if (!indicator) return null;

  const areaInfo = full?.domain && typeof full.domain === 'object' ? full.domain : null;
  const areaName = indicator.area || areaInfo?.name || '';
  const areaColor = indicator.color || areaInfo?.color || '#009368';
  const unit = full?.unit || indicator.unit || '';
  const description = full?.description || indicator.description || '';
  const chartTypes = full?.chart_types?.length ? full.chart_types : ['line', 'bar', 'column'];

  const chartSeries = chartData?.series || [];

  // "Last sync" = the most recent data point we actually have (data freshness),
  // falling back to the indicator doc's updated_at. Reading updated_at alone
  // showed "—" because it isn't bumped on data ingestion.
  const lastSync = latestPointX || (full?.updated_at ? new Date(full.updated_at).getTime() : null);
  const lastSyncLabel = lastSync
    ? new Date(lastSync).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Onest']">
      <div className={backdropClass} onClick={requestClose} aria-hidden />
      <aside className={`relative h-full w-full sm:w-[58%] sm:min-w-[620px] max-w-[880px] bg-[#fffefc] shadow-2xl flex flex-col ${panelClass}`}>
        {/* Header */}
        <div className="bg-[#f3f4f6] border-b border-[#e0e0e0] px-8 pt-10 pb-6 flex flex-col gap-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-semibold text-[28px] leading-[1.1] tracking-[-0.3px] text-[#0a0a0a]">{indicator.name}</h2>
            <button type="button" onClick={requestClose} aria-label={t('common.close', 'Fechar')} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer shrink-0">
              <LuX className="w-6 h-6" strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {unit && <span className="font-medium text-[16px] text-[#0a0a0a]">{unit}</span>}
            {unit && areaName && <span className="w-px h-5 bg-[#d4d4d4]" />}
            {areaName && (
              <span className="inline-flex items-center rounded-[22px] px-3 py-1.5 font-medium text-[14px] text-[#fffefc]" style={{ backgroundColor: areaColor }}>
                {areaName}
              </span>
            )}
            {resolvedSource && <span className="w-px h-5 bg-[#d4d4d4]" />}
            {resolvedSource && <SourcePill source={resolvedSource} />}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b border-[#e5e5e5] shrink-0">
          <div className="flex gap-8">
            {[
              { key: 'overview', label: t('admin.resources.tab_overview', 'Visão geral') },
              { key: 'data', label: t('admin.resources.tab_resources', 'Recursos') },
              { key: 'config', label: t('admin.resources.tab_config', 'Configuração') },
            ].map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`relative pb-3 pt-1 font-medium text-[18px] transition-colors cursor-pointer ${active ? 'text-[#009368]' : 'text-[#404040] hover:text-[#0a0a0a]'}`}>
                  {tab.label}
                  {active && <span className="absolute left-0 -bottom-px h-[2px] w-full bg-[#009368] rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-10">
              <section>
                <div className="pb-3 border-b border-[#e5e5e5] mb-6">
                  <h3 className="font-semibold text-[22px] text-[#0a0a0a]">{t('admin.resources.preview', 'Pré-visualização')}</h3>
                </div>
                <div className="bg-[#f9fafb] rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h4 className="font-semibold text-[20px] text-[#0a0a0a]">{indicator.name}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {chartTypes.map(type => {
                        const Icon = type === 'bar' ? LuChartBar : (type === 'line' || type === 'area') ? LuChartLine : LuChartColumn;
                        const active = previewType === type;
                        return (
                          <button key={type} type="button" onClick={() => setPreviewType(type)} title={t(CHART_TYPE_LABEL_KEYS[type] || '')}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${active ? 'border-[#009368] text-[#009368] bg-[#009368]/5' : 'border-[#e5e5e5] text-[#404040] hover:bg-black/[0.03]'}`}>
                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {loadingChart ? (
                    <div className="h-[300px] flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>
                  ) : chartSeries.length > 0 ? (
                    <GChart title="" chartId={`detail-${id}`} chartType={previewType || 'column'} xaxisType="datetime"
                      series={chartSeries} height={300} showLegend={true} disableAnimations={true} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-[#737373]">{t('admin.resources.no_data', 'Sem dados para pré-visualizar.')}</div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 bg-[#f9fafb] rounded-2xl px-6 py-4">
                  {resolvedSource && <SourcePill source={resolvedSource} />}
                  {full?.font && (<><span className="w-px h-5 bg-[#d4d4d4]" /><span className="font-medium text-[16px] text-[#0a0a0a]">{full.font}</span></>)}
                  <span className="w-px h-5 bg-[#d4d4d4]" />
                  <span className="text-[16px] text-[#404040]">{t('admin.resources.last_sync', 'Última sincronização')}: {lastSyncLabel}</span>
                </div>
              </section>

              <section>
                <div className="pb-3 border-b border-[#e5e5e5] mb-6">
                  <h3 className="font-semibold text-[22px] text-[#0a0a0a]">{t('admin.resources.description', 'Descrição')}</h3>
                </div>
                <p className="text-[17px] leading-7 text-[#404040] whitespace-pre-line">{description || t('admin.resources.no_description', 'Sem descrição.')}</p>
              </section>
            </div>
          )}

          {activeTab === 'data' && (
            <PanelErrorBoundary label={t('admin.resources.load_failed', 'Não foi possível carregar os recursos.')}>
              <IndicatorResourcesTab indicatorId={id} />
            </PanelErrorBoundary>
          )}

          {activeTab === 'config' && (
            <div className="flex flex-col gap-4 max-w-[640px]">
              {[
                { label: t('admin.indicators.col_area', 'Área'), value: areaName || '—' },
                { label: t('admin.indicators.col_dimension', 'Dimensão'), value: full?.subdomain || indicator.dimension || '—' },
                { label: t('wizard.indicator.unit', 'Unidade'), value: unit || '—' },
                { label: t('wizard.indicator.periodicity', 'Periodicidade'), value: full?.periodicity || '—' },
                { label: t('admin.indicators.col_governance', 'Governança'), value: full?.governance ? t('common.yes', 'Sim') : t('common.no', 'Não') },
                { label: t('wizard.indicator.default_chart_type_label', 'Tipo de gráfico'), value: (full?.chart_types || []).map(ct => t(CHART_TYPE_LABEL_KEYS[ct] || ct)).join(', ') || '—' },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-6 border-b border-[#e5e5e5] last:border-0 pb-3 last:pb-0">
                  <span className="font-medium text-[16px] text-[#404040]">{row.label}</span>
                  <span className="font-medium text-[16px] text-[#0a0a0a] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#fafafa] border-t border-[#e0e0e0] px-8 py-6 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={requestClose}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] transition-colors cursor-pointer">
            {t('common.close', 'Fechar')}
          </button>
          <button type="button" onClick={() => onEdit?.(id)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] transition-colors cursor-pointer">
            <LuSquarePen className="w-4 h-4" strokeWidth={1.75} />
            {t('admin.indicators.edit_indicator', 'Editar Indicador')}
          </button>
        </div>
      </aside>
    </div>
  );
}

IndicatorDetailPanel.propTypes = {
  indicator: PropTypes.object,
  source: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};
