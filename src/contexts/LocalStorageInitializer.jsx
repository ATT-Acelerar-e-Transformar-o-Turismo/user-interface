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
      // Use the domains directly since they're now from the JSON file
      const jsonDomains = domains;
      
      let indicators = [];
      let resources = [];
      jsonDomains.forEach((domain) => {
        domain.subdominios.forEach((subdomain) => {
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
        });
      });

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