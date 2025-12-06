import './App.css'
import DomainCard from './components/DomainCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import ErrorDisplay from './components/ErrorDisplay'
import PageTemplate from './pages/PageTemplate'
import { useDomain } from './contexts/DomainContext'
import { Link } from 'react-router-dom'

import nextgeneu from './assets/partners/nextgeneu.png'
import republic from './assets/partners/republica.png'
import prr from './assets/partners/prr_logo.png'


function App() {
  const { domains, loading, error } = useDomain();

  const partners = [
    { name: 'NextGen EU', logo: nextgeneu },
    { name: 'República', logo: republic },
    { name: 'PRR', logo: prr }
  ];

  const renderDomainCards = () => {
    if (loading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return <ErrorDisplay error={error} />;
    }

    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
        {domains.slice(0, 3).map((domain, index) => (
          <DomainCard
            key={index}
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
    <>
      <PageTemplate showSearchBox={false}>
        <div className="min-h-screen" style={{backgroundColor: '#fffdfb'}}>
          {/* Hero Section */}
          <section className="text-center py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                A raíz das<br />
                decisões certas.
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                A plataforma que conecta pessoas, negócios e cidades através de dados que importam.
              </p>
              <Link
                to="/domains"
                className="inline-block bg-primary text-primary-content font-semibold py-4 px-8 rounded-full transition-colors duration-200 hover:bg-primary/90"
              >
                Ver Indicadores
              </Link>
            </div>
          </section>

          {/* Partners Section */}
          {partners.length > 0 && (
            <section className="py-8 px-4" style={{backgroundColor: '#f5f5f5'}}>
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-2xl font-semibold text-black mb-12">Com o apoio de</h2>
                <div className="flex flex-wrap justify-center items-center gap-6 px-4">
                  {partners.map((partner, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-[40px] px-12 py-8 shadow-sm hover:shadow-md transition-shadow min-w-[200px] flex items-center justify-center"
                    >
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="max-h-16 w-auto object-contain opacity-70"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Featured Domains Section */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Explore nossos domínios
              </h2>
              {renderDomainCards()}
            </div>
          </section>
        </div>
      </PageTemplate>
    </>
  )
}


export default App
