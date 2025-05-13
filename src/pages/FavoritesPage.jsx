import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";

export default function FavoritesPage() {
  const [favoriteIndicators, setFavoriteIndicators] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const { domains } = useDomain();

  // Graph icons - reusing the same icons from DomainTemplate
  const GraphTypes = [
    { icon: "📊" },
    { icon: "📈" },
    { icon: "📉" },
    { icon: "📈" },
    { icon: "📉" },
  ];

  // Function to load favorites from localStorage
  const loadFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
    
    // Find all indicator objects that match the favorite IDs
    const favoriteIndicatorObjects = [];
    
    domains.forEach(domain => {
      domain.subdominios && domain.subdominios.forEach(subdomain => {
        subdomain.indicadores && subdomain.indicadores.forEach(indicator => {
          if (favorites.includes(indicator.id)) {
            favoriteIndicatorObjects.push({
              ...indicator,
              domainName: domain.nome,
              subdomainName: subdomain.nome,
              domainColor: domain.DomainColor
            });
          }
        });
      });
    });
    
    setFavoriteIndicators(favoriteIndicatorObjects);
  };

  // Load favorites on component mount
  useEffect(() => {
    loadFavorites();

    // Listen for storage events to refresh favorites when they change
    const handleStorageChange = (e) => {
      if (e.key === 'favoriteIndicators') {
        loadFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [domains]);

  // Filter indicators based on selected domain/subdomain
  const filteredIndicators = favoriteIndicators.filter(indicator => {
    // No domain filter applied
    if (!selectedDomain) {
      return true;
    }
    
    // Filter by domain
    if (indicator.domainName !== selectedDomain.nome) {
      return false;
    }
    
    // Filter by subdomain if selected
    if (selectedSubdomain && indicator.subdomainName !== selectedSubdomain.nome) {
      return false;
    }
    
    return true;
  });

  // For debugging
  console.log("Selected domain:", selectedDomain?.nome);
  console.log("Filtered indicators:", filteredIndicators.length);

  return (
    <PageTemplate>
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Meus Indicadores Favoritos</h1>
        <Dropdowns
          setSelectedDomain={setSelectedDomain}
          setSelectedSubdomain={setSelectedSubdomain}
          showIndicatorDropdown={false}
          allowSubdomainClear={true}
        />
      </div>
      
      {filteredIndicators.length === 0 ? (
        <div className="text-center p-8">
          <h2 className="text-xl">
            {selectedDomain 
              ? `Nenhum indicador favorito encontrado para ${selectedDomain.nome}` 
              : "Você ainda não tem indicadores favoritos."}
          </h2>
          <p className="mt-2">Adicione indicadores aos favoritos clicando no ícone de coração nas páginas de domínios.</p>
        </div>
      ) : (
        <div className="flex flex-wrap place-content-center gap-4">
          {filteredIndicators.map((indicator) => (
            <IndicatorCard
              key={indicator.id}
              IndicatorTitle={indicator.nome}
              IndicatorId={indicator.id}
              GraphTypes={GraphTypes}
            />
          ))}
        </div>
      )}
    </PageTemplate>
  );
} 