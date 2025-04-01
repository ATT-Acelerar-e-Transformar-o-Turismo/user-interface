import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routesList } from './routes.jsx'
import { DomainProvider } from './contexts/DomainContext';
import { ResourceProvider } from './contexts/ResourceContext';
import domainsData from '../public/domains.json';

function initializeLocalStorage() {
  function getRandomFavourites() {
    return Math.floor(-Math.log(Math.random(), 2));
  }

  function getRandomGovernance() {
    return Math.random() < 0.2;
  }

  if (!localStorage.getItem('domains') || !localStorage.getItem('indicators') || !localStorage.getItem('resources')) {
    let domains = domainsData.dominios.map((domain, index) => ({
      id: index + 1,
      name: domain.nome,
      color: domain.DomainColor,
      image: domain.DomainImage,
      subdomains: []
    })).sort((a, b) => a.name.localeCompare(b.name));

    let indicators = [];
    let resources = [];
    domainsData.dominios.forEach((domain, domainIndex) => {
      domain.subdominios.forEach((subdomain) => {
        domains[domainIndex].subdomains.push(subdomain.nome);
        subdomain.indicadores.forEach((indicator, indicatorIndex) => {
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
    if (!localStorage.getItem('domains')) {
      localStorage.setItem('domains', JSON.stringify(domains));
    }
    if (!localStorage.getItem('resources')) {
      localStorage.setItem('resources', JSON.stringify(resources));
    }
  }
}

initializeLocalStorage();

const router = createBrowserRouter(routesList)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DomainProvider>
      <ResourceProvider>
        <RouterProvider 
          router={router} 
          future={{ v7_startTransition: true ,}}
        />
      </ResourceProvider>
    </DomainProvider>
  </React.StrictMode>
)
