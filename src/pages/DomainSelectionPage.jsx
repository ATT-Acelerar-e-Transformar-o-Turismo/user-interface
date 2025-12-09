import DomainCard from '../components/DomainCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import PageTemplate from './PageTemplate';
import { useDomain } from '../contexts/DomainContext';

/**
 * DomainSelectionPage - Shows all domain cards for users to select and navigate
 * Used when clicking "Indicadores" in the client navbar
 */
export default function DomainSelectionPage() {
  const { domains, loading, error } = useDomain();

  const renderDomainCards = () => {
    if (loading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return <ErrorDisplay error={error} />;
    }

    if (domains.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum domínio disponível no momento.</p>
        </div>
      );
    }

    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
        {domains.map((domain, index) => (
          <DomainCard
            key={domain?.id || index}
            DomainTitle={domain?.name || "Unnamed Domain"}
            DomainPage={domain.DomainPage || (domain?.name ? `/${domain.name.toLowerCase().replace(/\s+/g, '-')}` : '/unknown-domain')}
            DomainColor={domain?.color}
            DomainImage={domain?.image}
          />
        ))}
      </div>
    );
  };

  return (
    <PageTemplate showSearchBox={true}>
      <div className="min-h-screen py-16 px-4" style={{backgroundColor: '#fffdfb'}}>
        <div className="max-w-6xl mx-auto">
          <h1 className="font-['Onest',sans-serif] font-semibold text-5xl text-center text-black mb-4">
            Indicadores por Domínio
          </h1>
          <p className="font-['Onest',sans-serif] text-lg text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Selecione um domínio para explorar os indicadores disponíveis
          </p>
          {renderDomainCards()}
        </div>
      </div>
    </PageTemplate>
  );
}
