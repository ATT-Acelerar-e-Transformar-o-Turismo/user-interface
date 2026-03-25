import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DomainCard from '../components/DomainCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import PageTemplate from './PageTemplate';
import { useDomain } from '../contexts/DomainContext';
import { useTranslation } from 'react-i18next';
import indicatorService from '../services/indicatorService';

export default function DomainSelectionPage() {
  const { t } = useTranslation();
  const { domains, loading, error } = useDomain();
  const [domainIndicators, setDomainIndicators] = useState({});

  // Fetch first 4 indicators per domain for card display
  useEffect(() => {
    if (!domains || domains.length === 0) return;
    domains.forEach(domain => {
      if (!domain?.id || domainIndicators[domain.id]) return;
      indicatorService.getByDomain(domain.id, 0, 4).then(indicators => {
        setDomainIndicators(prev => ({ ...prev, [domain.id]: indicators }));
      }).catch(() => {});
    });
  }, [domains]);

  return (
    <PageTemplate showSearchBox={true}>
      <div className="min-h-screen bg-[#f3f4f6] relative">
        {/* Decorative green swoosh — top right, behind content */}
        <img
          src="/assets/vectors/indicator-vector.svg"
          alt=""
          className="absolute right-0 w-80 pointer-events-none z-0"
          style={{ top: 'calc(-1 * (var(--navbar-height) + 6rem))' }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-[1512px] mx-auto px-12 pb-20">
          {/* Header — left-aligned, matching Figma */}
          <div className="flex flex-col gap-6 mb-16">
            <h1 className="font-['Onest'] font-semibold text-5xl leading-none text-[#0a0a0a] tracking-tight">
              {t('home.title')}
            </h1>
            <p className="font-['Onest'] font-medium text-2xl leading-snug text-[#0a0a0a]">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Domain cards — row with justify-between on desktop */}
          {loading && <LoadingSkeleton />}
          {error && <ErrorDisplay error={error} />}
          {!loading && !error && domains.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t('home.no_domains')}</p>
            </div>
          )}
          {!loading && !error && domains.length > 0 && (
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
              {domains.map((domain, index) => {
                const indicators = domainIndicators[domain.id] || [];
                // Use fetched indicators (with IDs) or fall back to subdomain names
                const indicatorItems = indicators.length > 0
                  ? indicators.map(ind => ({ id: ind.id, name: ind.name }))
                  : (domain?.subdomains?.map(s => ({ name: s.name || s })) || []);
                return (
                  <DomainCard
                    key={domain?.id || index}
                    title={domain?.name || "Unnamed Domain"}
                    page={`/indicators/${domain?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
                    color={domain?.DomainColor || domain?.color}
                    icon={domain?.DomainIcon}
                    indicators={indicatorItems}
                    shadowColor={domain?.DomainColor || domain?.color}
                  />
                );
              })}
            </div>
          )}

          {/* "Ver todos os indicadores" button — centered below cards */}
          <div className="flex justify-center mt-16">
            <Link
              to="/all-indicators"
              className="font-['Onest'] font-medium text-lg text-[#0a0a0a] border border-[#d4d4d4] rounded-full px-6 py-2 hover:bg-white/60 transition-colors shadow-sm"
            >
              {t('home.view_all_indicators')}
            </Link>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
