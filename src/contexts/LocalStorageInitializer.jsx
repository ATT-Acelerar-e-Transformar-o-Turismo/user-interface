import { useEffect } from 'react';
import { useDomain } from './DomainContext';
import domainsData from '../../public/domains.json';

export function LocalStorageInitializer() {
  const { domains } = useDomain();

  useEffect(() => {
    if (!domains || domains.length === 0) {
      return; // Wait until domains is loaded
    }

    function getRandomFavourites() {
      return Math.floor(-Math.log(Math.random(), 2));
    }

    function getRandomGovernance() {
      return Math.random() < 0.2;
    }

    if (!localStorage.getItem('indicators') || !localStorage.getItem('resources')) {
      // Check if domains have the old JSON structure (subdominios/indicadores) or new API structure
      const hasOldStructure = domains.some(domain => domain.subdominios && Array.isArray(domain.subdominios));
      
      let indicators = [];
      let resources = [];
      
      if (hasOldStructure) {
        // Handle old JSON structure
        domains.forEach((domain) => {
          if (domain.subdominios && Array.isArray(domain.subdominios)) {
        domain.subdominios.forEach((subdomain) => {
              if (subdomain.indicadores && Array.isArray(subdomain.indicadores)) {
          subdomain.indicadores.forEach((indicator) => {
            indicators.push({
              id: indicators.length + 1,
              name: indicator.nome,
              periodicity: indicator.caracteristicas.periodicidade,
              domain: domain.nome,
              subdomain: subdomain.nome,
              favourites: getRandomFavourites(),
              governance: getRandomGovernance(),
              description: "",
              font: "",
              scale: indicator.caracteristicas.unidade_de_medida,
            });

            resources.push({
              id: resources.length + 1,
              name: `${indicator.nome.replace(/\s+/g, '_').toLowerCase()}.csv`,
              'start period': '',
              'end period': '',
              indicator: indicators.length,
              edit: true,
            });
          });
              }
        });
          }
      });
      } else {
        // Handle new API structure - create minimal test data since the API structure doesn't include indicators
        console.log('Domains loaded from API - using minimal test data for localStorage');
        
        // Create some test indicators for each domain
        domains.forEach((domain, domainIndex) => {
          if (domain.subdomains && Array.isArray(domain.subdomains)) {
            domain.subdomains.forEach((subdomain, subdomainIndex) => {
              // Create 2-3 test indicators per subdomain
              for (let i = 0; i < 2; i++) {
                indicators.push({
                  id: indicators.length + 1,
                  name: `Test Indicator ${i + 1} - ${subdomain}`,
                  periodicity: 'Monthly',
                  domain: domain.name,
                  subdomain: subdomain,
                  favourites: getRandomFavourites(),
                  governance: getRandomGovernance(),
                  description: `Test indicator for ${subdomain} in ${domain.name}`,
                  font: "",
                  scale: "Units",
                });

                resources.push({
                  id: resources.length + 1,
                  name: `test_indicator_${i + 1}_${subdomain.replace(/\s+/g, '_').toLowerCase()}.csv`,
                  'start period': '',
                  'end period': '',
                  indicator: indicators.length,
                  edit: true,
                });
              }
            });
          }
        });
      }

      indicators.sort((a, b) => a.name.localeCompare(b.name));
      resources.sort((a, b) => a.name.localeCompare(b.name));

      if (!localStorage.getItem('indicators')) {
        localStorage.setItem('indicators', JSON.stringify(indicators));
      }
      if (!localStorage.getItem('resources')) {
        localStorage.setItem('resources', JSON.stringify(resources));
      }
    }
  }, [domains]);

  return null; // This component doesn't render anything
}

export default LocalStorageInitializer; 