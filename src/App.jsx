import './App.css'
import Carousel from './components/Carousel'
import DomainCard from './components/DomainCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import ErrorDisplay from './components/ErrorDisplay'
import PageTemplate from './pages/PageTemplate'
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
            DomainTitle={domain.name} 
            DomainPage={domain.DomainPage || `/${domain.name.toLowerCase().replace(/\s+/g, '-')}`} 
            DomainColor={domain.color || domain.DomainColor} 
            DomainImage={domain.image || domain.DomainImage} 
          />
        ))}
      </div>
    );
  };
  
  return (
    <>
      <PageTemplate>
        <div className="flex flex-col items-center">
          <Carousel images={images} />
          <label className="input my-4">
            <svg className="h-[1em] opacity-50 btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></g></svg>
            <input type="search" className="grow" placeholder="Procurar por Indicador" />
          </label>
          {renderContent()}
        </div>
      </PageTemplate>
    </>
  )
}


export default App
