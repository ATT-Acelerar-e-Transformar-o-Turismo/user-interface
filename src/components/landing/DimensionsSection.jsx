import React from 'react';
import DomainCard from '../DomainCard';
import { useDomain } from '../../contexts/DomainContext';
import useLocalizedName from '../../hooks/useLocalizedName';
import { useTranslation } from 'react-i18next';

export default function DimensionsSection() {
  const { domains, loading, error } = useDomain();
  const getName = useLocalizedName();
  const { t } = useTranslation();

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
            <p>{t('home.error_loading_domains', { error })}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:justify-center gap-8 lg:gap-[120px]">
            {domains.map((domain, index) => (
              <DomainCard
                key={domain.id}
                title={getName(domain)}
                color={domain.DomainColor}
                indicators={domain.subdomains?.map(sub => getName(sub)) || []}
                icon={domain.DomainIcon}
                shadowColor={domain.DomainColor}
                page={`/indicators/${domain.name.toLowerCase()}`}
                data-aos="fade-up"
                data-aos-delay={100 + (index * 150)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
