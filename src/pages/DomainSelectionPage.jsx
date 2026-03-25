import { Link } from 'react-router-dom';
import DomainCard from '../components/DomainCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import PageTemplate from './PageTemplate';
import { useDomain } from '../contexts/DomainContext';
import { useTranslation } from 'react-i18next';

export default function DomainSelectionPage() {
  const { t } = useTranslation();
  const { domains, loading, error } = useDomain();

  return (
    <PageTemplate showSearchBox={true}>
      <div className="min-h-screen bg-[#f3f4f6] relative">
        {/* Decorative green swoosh — top right, behind content */}
        <img
          src="/assets/vectors/indicator-vector.svg"
          alt=""
          className="absolute right-0 w-80 pointer-events-none z-0"
          style={{ top: 'calc(-1 * (var(--navbar-height) + 6rem))', transform: 'translate(10%, 0)' }}
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
              {domains.map((domain, index) => (
                <DomainCard
                  key={domain?.id || index}
                  title={domain?.name || "Unnamed Domain"}
                  page={`/indicators/${domain?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
                  color={domain?.DomainColor || domain?.color}
                  icon={domain?.DomainIcon}
                  indicators={domain?.subdomains?.map(s => s.name) || []}
                  shadowColor={domain?.DomainColor || domain?.color}
                />
              ))}
            </div>
          )}

          {/* "Ver todos os indicadores" button — centered below cards */}
          <div className="flex justify-center mt-16">
            <Link
              to="/all-indicators"
              className="font-['Onest'] font-medium text-lg text-[#0a0a0a] border border-[#d4d4d4] rounded-full px-6 py-2 hover:bg-white/60 transition-colors shadow-sm"
            >
              Ver todos os indicadores
            </Link>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
