import { useEffect, useRef, useState } from 'react';
import AreaCard from '../components/AreaCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import PageTemplate from './PageTemplate';
import AreaTemplate from './AreaTemplate';
import { useArea } from '../contexts/AreaContext';
import { useTranslation } from 'react-i18next';
import useLocalizedName from '../hooks/useLocalizedName';
import { indicatorService } from '../services/indicatorService';
import { useSearchParams } from 'react-router-dom';

export default function AreaSelectionPage() {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const { areas, loading, error } = useArea();
  const [indicatorsByArea, setIndicatorsByArea] = useState({});
  const [searchParams] = useSearchParams();
  const [showAll, setShowAll] = useState(() => Boolean(searchParams.get('q')));
  const allSectionRef = useRef(null);

  const handleShowAll = () => {
    setShowAll(true);
    setTimeout(() => {
      allSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleHideAll = () => {
    setShowAll(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    if (!areas?.length) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        areas.map(async (area) => {
          if (!area?.id) return [null, []];
          try {
            const list = await indicatorService.getByArea(area.id, 0, 12);
            return [area.id, Array.isArray(list) ? list : []];
          } catch {
            return [area.id, []];
          }
        })
      );
      if (!cancelled) setIndicatorsByArea(Object.fromEntries(entries.filter(([k]) => k)));
    })();
    return () => { cancelled = true; };
  }, [areas]);

  return (
    <PageTemplate showSearchBox={true}>
      <div className="min-h-screen bg-[#f3f4f6] relative">
        {/* Decorative green swoosh — top right, behind content */}
        <img
          src="/assets/vectors/indicator-vector.svg"
          alt=""
          className="absolute right-0 w-80 pointer-events-none z-0 hidden sm:block"
          style={{ top: 'calc(-1 * (var(--navbar-height) + 6rem))' }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-[1512px] mx-auto px-4 sm:px-12 pb-20">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:gap-6 mb-8 sm:mb-16">
            <h1 className="font-['Onest'] font-semibold text-3xl sm:text-5xl leading-none text-[#0a0a0a] tracking-tight">
              {t('home.title')}
            </h1>
            <p className="font-['Onest'] font-medium text-base sm:text-2xl leading-snug text-[#0a0a0a]">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Area cards — row with justify-between on desktop */}
          {loading && <LoadingSkeleton />}
          {error && <ErrorDisplay error={error} />}
          {!loading && !error && areas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t('home.no_areas')}</p>
            </div>
          )}
          {!loading && !error && areas.length > 0 && (
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
              {areas.map((area, index) => (
                <AreaCard
                  key={area?.id || index}
                  title={getName(area) || "Unnamed Area"}
                  areaId={area?.id}
                  page={`/indicators/${area?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
                  color={area?.AreaColor || area?.color}
                  icon={area?.AreaIcon}
                  indicators={indicatorsByArea[area?.id] || []}
                  shadowColor={area?.AreaColor || area?.color}
                />
              ))}
            </div>
          )}

          {!showAll && (
            <div className="flex justify-center mt-8 sm:mt-16">
              <button
                type="button"
                onClick={handleShowAll}
                className="font-['Onest'] font-medium text-xl text-[#0a0a0a] bg-white/60 border border-[#d4d4d4] rounded-full px-8 py-3 shadow-sm hover:bg-white transition-colors cursor-pointer flex items-center gap-2.5 tracking-[0.1px]"
              >
                <span>{t('home.view_all_indicators')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {showAll && (
            <div ref={allSectionRef} className="mt-12 sm:mt-20">
              <AreaTemplate embedded />
              <div className="flex justify-center mt-8 sm:mt-16">
                <button
                  type="button"
                  onClick={handleHideAll}
                  className="font-['Onest'] font-medium text-xl text-[#0a0a0a] bg-white/60 border border-[#d4d4d4] rounded-full px-8 py-3 shadow-sm hover:bg-white transition-colors cursor-pointer flex items-center gap-2.5 tracking-[0.1px]"
                >
                  <span>{t('home.hide_all_indicators')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
