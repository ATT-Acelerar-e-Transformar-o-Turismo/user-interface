import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import useLocalizedName from '../../hooks/useLocalizedName';
import indicatorService from '../../services/indicatorService';
import resourceService from '../../services/resourceService';
import { countSources, SOURCE_API, SOURCE_UPLOAD } from '../../utils/resourceSource';

// Stats summary row for the Indicators dashboard (Figma node 2885:14148).
// Four cards: total indicators, breakdown by area, data-source breakdown and
// the share of governance indicators. Each value comes from existing
// endpoints — see the data notes inline.

const CARD = "bg-[#fffefc] rounded-2xl p-8 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)] flex flex-col gap-6 min-h-[220px]";
const CARD_TITLE = "font-['Onest'] font-medium text-[24px] leading-6 text-[#404040]";
const BIG_NUMBER = "font-['Onest'] font-semibold text-[64px] leading-none tracking-[-0.64px] text-[#0a0a0a]";
const CAPTION = "font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a]";

function Dot({ color }) {
  return <span aria-hidden className="inline-block w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}
Dot.propTypes = { color: PropTypes.string };

function LegendRow({ color, children }) {
  return (
    <div className="flex items-center gap-4">
      <Dot color={color} />
      <span className="font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a]">{children}</span>
    </div>
  );
}
LegendRow.propTypes = { color: PropTypes.string, children: PropTypes.node };

export default function IndicatorDashboardStats({ areas }) {
  const { t } = useTranslation();
  const getName = useLocalizedName();

  const [total, setTotal] = useState(null);
  const [governanceTotal, setGovernanceTotal] = useState(null);
  const [perArea, setPerArea] = useState([]); // [{ id, name, color, count }]
  const [sources, setSources] = useState(null); // { api, upload }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Total indicators (including hidden so the admin sees the real total).
        const totalCount = await indicatorService.getCount(true);

        // Per-area counts, and per-area governance counts. There is no global
        // governance count endpoint, so we sum the per-area governance counts.
        const areaResults = await Promise.all(
          (areas || []).map(async (a) => {
            const [count, govCount] = await Promise.all([
              indicatorService.getCountByArea(a.id, null, true),
              indicatorService.getCountByArea(a.id, true, true),
            ]);
            return {
              id: a.id,
              name: getName(a) || a.name || '—',
              color: a.color || '#d4d4d4',
              count: count || 0,
              govCount: govCount || 0,
            };
          })
        );

        // Data sources: classify the full resource pool. The backend caps
        // `limit` at 50, so paginate until a short page arrives.
        let sourceCounts = null;
        try {
          const pageSize = 50;
          const maxPages = 40; // safety stop (2000 resources)
          const allResources = [];
          for (let i = 0; i < maxPages; i++) {
            const batch = await resourceService.getAll(i * pageSize, pageSize);
            if (!Array.isArray(batch) || batch.length === 0) break;
            allResources.push(...batch);
            if (batch.length < pageSize) break;
          }
          sourceCounts = countSources(allResources);
        } catch (err) {
          console.warn('Dashboard stats: could not load resources', err);
        }

        if (cancelled) return;
        setTotal(totalCount || 0);
        setPerArea(areaResults);
        setGovernanceTotal(areaResults.reduce((sum, a) => sum + a.govCount, 0));
        setSources(sourceCounts);
      } catch (err) {
        console.warn('Dashboard stats: failed to load', err);
      }
    }

    if (areas && areas.length > 0) load();
    return () => { cancelled = true; };
    // `getName` is recreated each render; depend on the language flag instead
    // of the function identity to avoid an infinite re-fetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, getName.isEn]);

  const govPercent = total && governanceTotal != null && total > 0
    ? Math.round((governanceTotal / total) * 100)
    : null;

  return (
    <div className="flex flex-wrap gap-8 mb-14">
      {/* Total indicators */}
      <div className={`${CARD} w-[320px] flex-1 min-w-[280px]`}>
        <p className={CARD_TITLE}>{t('admin.indicators.stats.total_title', 'Total de Indicadores')}</p>
        <p className={BIG_NUMBER}>{total ?? '—'}</p>
        <p className={CAPTION}>
          {t('admin.indicators.stats.total_caption', { count: areas?.length || 0, defaultValue: 'distribuídos pelas {{count}} áreas' })}
        </p>
      </div>

      {/* Indicators by area */}
      <div className={`${CARD} w-[320px] flex-1 min-w-[280px]`}>
        <p className={CARD_TITLE}>{t('admin.indicators.stats.by_area_title', 'Indicadores por área')}</p>
        <div className="flex flex-col gap-4">
          {perArea.length === 0 ? (
            <span className="font-['Onest'] text-[18px] text-[#737373]">—</span>
          ) : (
            perArea.map(a => (
              <LegendRow key={a.id} color={a.color}>{a.name} - {a.count}</LegendRow>
            ))
          )}
        </div>
      </div>

      {/* Data sources */}
      <div className={`${CARD} w-[320px] flex-1 min-w-[280px]`}>
        <p className={CARD_TITLE}>{t('admin.indicators.stats.sources_title', 'Fontes de dados')}</p>
        <div className="flex flex-col gap-4">
          {!sources ? (
            <span className="font-['Onest'] text-[18px] text-[#737373]">—</span>
          ) : (
            <>
              <LegendRow color="#eab308">{t('admin.indicators.source_api', 'API')} - {sources[SOURCE_API]}</LegendRow>
              <LegendRow color="#fb7185">{t('admin.indicators.source_upload', 'Upload')} - {sources[SOURCE_UPLOAD]}</LegendRow>
            </>
          )}
        </div>
      </div>

      {/* Governance share */}
      <div className={`${CARD} w-[360px] flex-1 min-w-[280px]`}>
        <p className={CARD_TITLE}>{t('admin.indicators.stats.governance_title', 'Indicadores de governança')}</p>
        <p className={BIG_NUMBER}>{govPercent != null ? `${govPercent}%` : '—'}</p>
        <p className={CAPTION}>{t('admin.indicators.stats.governance_caption', 'do total de indicadores')}</p>
      </div>
    </div>
  );
}

IndicatorDashboardStats.propTypes = {
  areas: PropTypes.arrayOf(PropTypes.object),
};
