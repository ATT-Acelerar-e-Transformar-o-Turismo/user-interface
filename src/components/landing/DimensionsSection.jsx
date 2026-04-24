import { useEffect, useState } from 'react';
import AreaCard from '../AreaCard';
import { useArea } from '../../contexts/AreaContext';
import useLocalizedName from '../../hooks/useLocalizedName';
import { useTranslation } from 'react-i18next';
import { indicatorService } from '../../services/indicatorService';

export default function DimensionsSection() {
  const { areas, loading, error } = useArea();
  const getName = useLocalizedName();
  const { t } = useTranslation();
  const [indicatorsByArea, setIndicatorsByArea] = useState({});

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
    <div className="relative w-full py-16 lg:py-32">
      <div className="max-w-[1512px] mx-auto px-4 lg:px-12">
        <div className="text-left lg:text-center mb-10 lg:mb-24" data-aos="fade-down">
            <h2 className="font-['Onest'] font-semibold text-[32px] lg:text-[48px] text-[#0a0a0a] mb-2 lg:mb-4">
            {t('home.title')}
            </h2>
            <p className="font-['Onest'] font-medium text-[16px] lg:text-[24px] text-[#0a0a0a] opacity-80">
            {t('home.subtitle')}
            </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600">
            <p>{t('home.error_loading_areas', { error })}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-12">
            {areas.map((area, index) => (
              <div key={area.id} className="w-full max-w-[392px] mx-auto sm:mx-0 sm:w-[392px]">
                <AreaCard
                  title={getName(area)}
                  areaId={area?.id}
                  color={area.AreaColor}
                  indicators={indicatorsByArea[area?.id] || []}
                  icon={area.AreaIcon}
                  shadowColor={area.AreaColor}
                  page={`/indicators/${area.name.toLowerCase()}`}
                  data-aos="fade-up"
                  data-aos-delay={100 + (index * 150)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
