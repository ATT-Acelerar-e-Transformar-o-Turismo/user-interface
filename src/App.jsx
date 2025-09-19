import './App.css'
import Carousel from './components/Carousel'
import DomainCard from './components/DomainCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import ErrorDisplay from './components/ErrorDisplay'
import PageTemplate from './pages/PageTemplate'
import SearchBox from './components/SearchBox'
import { useDomain } from './contexts/DomainContext'


const images = [
  "../public/14.jpg",
  "https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp",
  "https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp",
  "https://img.daisyui.com/images/stock/photo-1665553365602-b2fb8e5d1707.webp",
]


function App() {
  const { domains, loading, error } = useDomain();
  
  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton />;
    }
    
    if (error) {
      return <ErrorDisplay error={error} />;
    }
    
    return (
      <div className='flex flex-row flex-wrap place-content-center gap-8 my-8 w-full'>
        {domains.map((domain, index) => (
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
        <div className="flex flex-col items-center">
          <Carousel images={images} />
          <div className="my-6">
            <SearchBox />
          </div>
          {renderContent()}
        </div>
      </PageTemplate>
    </>
  )
}


export default App
