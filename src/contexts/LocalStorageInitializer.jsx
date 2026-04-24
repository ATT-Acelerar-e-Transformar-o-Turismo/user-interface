import { useEffect } from 'react';
import { useArea } from './AreaContext';
import { ptCompare } from '../utils/sort';

export function LocalStorageInitializer() {
  const { areas } = useArea();

  useEffect(() => {
    if (!areas || areas.length === 0) {
      return; // Wait until areas is loaded
    }

    function getRandomFavourites() {
      return Math.floor(-Math.log(Math.random(), 2));
    }

    function getRandomGovernance() {
      return Math.random() < 0.2;
    }

    if (!localStorage.getItem('indicators') || !localStorage.getItem('resources')) {
      // Check if areas have the old JSON structure (subdominios/indicadores) or new API structure
      const hasOldStructure = areas && areas.some(area => area.subdominios && Array.isArray(area.subdominios));
      
      let indicators = [];
      let resources = [];
      
      if (hasOldStructure) {
        // Handle old JSON structure
        areas && areas.forEach((area) => {
          if (area.subdominios && Array.isArray(area.subdominios)) {
        area.subdominios.forEach((dimension) => {
              if (dimension.indicadores && Array.isArray(dimension.indicadores)) {
          dimension.indicadores.forEach((indicator) => {
            indicators.push({
              id: indicators.length + 1,
              name: indicator.nome,
              periodicity: indicator.caracteristicas.periodicidade,
              area: area.nome,
              dimension: dimension.nome,
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
        console.log('Areas loaded from API - using minimal test data for localStorage');
        
        // Create some test indicators for each area
        areas && areas.forEach((area) => {
          if (area.dimensions && Array.isArray(area.dimensions)) {
            area.dimensions.forEach((dimension) => {
              // Create 2-3 test indicators per dimension
              for (let i = 0; i < 2; i++) {
                indicators.push({
                  id: indicators.length + 1,
                  name: `Test Indicator ${i + 1} - ${dimension}`,
                  periodicity: 'Monthly',
                  area: area.name,
                  dimension: dimension,
                  favourites: getRandomFavourites(),
                  governance: getRandomGovernance(),
                  description: `Test indicator for ${dimension} in ${area.name}`,
                  font: "",
                  scale: "Units",
                });

                resources.push({
                  id: resources.length + 1,
                  name: `test_indicator_${i + 1}_${dimension.replace(/\s+/g, '_').toLowerCase()}.csv`,
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

      indicators.sort((a, b) => ptCompare(a.name, b.name));
      resources.sort((a, b) => ptCompare(a.name, b.name));

      if (!localStorage.getItem('indicators')) {
        localStorage.setItem('indicators', JSON.stringify(indicators));
      }
      if (!localStorage.getItem('resources')) {
        localStorage.setItem('resources', JSON.stringify(resources));
      }
    }
  }, [areas]);

  return null; // This component doesn't render anything
}

export default LocalStorageInitializer; 