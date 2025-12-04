import './App.css'
import DomainCard from './components/DomainCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import ErrorDisplay from './components/ErrorDisplay'
import PageTemplate from './pages/PageTemplate'
import { useDomain } from './contexts/DomainContext'
import { Link } from 'react-router-dom'
import partnerLogos from './assets/partner-logos.png'


function App() {
  const { domains, loading, error } = useDomain();

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
                className="inline-block text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200"
                style={{backgroundColor: '#009367'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#007a5a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#009367'}
              >
                Ver Indicadores
              </Link>
            </div>
          </section>

          {/* Partners Section */}
          <section className="py-16 px-4" style={{backgroundColor: '#fffdfb'}}>
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-lg text-gray-600 mb-12">Com o apoio de</h2>
              <div className="flex justify-center items-center">
                <img
                  src={partnerLogos}
                  alt="Logótipos dos parceiros"
                  className="max-w-full h-auto opacity-80"
                />
              </div>
            </div>
          </section>

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
