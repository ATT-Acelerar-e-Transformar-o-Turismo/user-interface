import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import domains from "../../public/domains.json";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns"; // the new component
import Indicator from "../components/indicator";

export default function IndicatorTemplate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { domainName, subdomainName, indicatorId } = location.state || {};

  // 1) Find the "official" domain/subdomain/indicator from route
  const domainObj = domains.dominios.find((dom) => dom.nome === domainName);
  if (!domainObj) return <div>Domínio não encontrado.</div>;

  const subdomainObj = domainObj.subdominios.find((sub) => sub.nome === subdomainName);
  if (!subdomainObj) return <div>Subdomínio não encontrado.</div>;

  const indicatorObj = subdomainObj.indicadores.find(
    (ind) => ind.id === Number(indicatorId)
  );
  if (!indicatorObj) return <div>Indicador não encontrado.</div>;

  // The user sees this domain/subdomain/indicator on screen
  // until they pick a new indicator in the dropdown.

  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    navigate(`/indicator/${newIndicator.id}`, {
      state: {
        domainName: newDomain.nome,
        subdomainName: newSubdomain.nome,
        indicatorId: newIndicator.id,
      },
    });
  };

  const images = domainObj.DomainCarouselImages;

  // Example chart data
  const exampleCharts = [
    {
      chartType: 'line',
      xaxisType: 'datetime',
      group: 'sales',
      availableFilters: {
        segment: {
          label: 'Segment',
          values: ['B2B', 'B2C']
        }
      },
      activeFilters: {
        segment: {
          label: 'Segment',
          values: ['B2B']
        }
      },
      annotations: {
        xaxis: [{
          value: new Date('06/01/2020').getTime(),
          label: 'segregação de freguesias'
        }],
        yaxis: [{
          value: 170,
          label: 'carrying capacity limit'
        }]
      },
      series: [
        {
          name: 'B2B Sales',
          hidden: false,
          filterValues: [
            { label: 'Segment', value: 'B2B' }
          ],
          data: [
            { x: '2020-01-01', y: 30 },
            { x: '2020-02-01', y: 40 },
            { x: '2020-03-01', y: 35 },
            { x: '2020-04-01', y: 50 },
            { x: '2020-05-01', y: 49 },
            { x: '2020-06-01', y: 60 },
            { x: '2020-07-01', y: 70 },
            { x: '2020-08-01', y: 80 },
            { x: '2020-09-01', y: 90 },
            { x: '2020-10-01', y: 100 },
            { x: '2020-11-01', y: 110 },
            { x: '2020-12-01', y: 120 },
            { x: '2021-01-01', y: 130 },
            { x: '2021-02-01', y: 140 },
            { x: '2021-03-01', y: 150 },
            { x: '2021-04-01', y: 160 },
            { x: '2021-05-01', y: 170 },
            { x: '2021-06-01', y: 180 },
            { x: '2021-07-01', y: 190 },
            { x: '2021-08-01', y: 200 },
            { x: '2021-09-01', y: 210 },
            { x: '2021-10-01', y: 220 },
            { x: '2021-11-01', y: 230 },
            { x: '2021-12-01', y: 240 },
          ]
        },
        {
          name: 'B2C Sales',
          hidden: true,
          filterValues: [
            { label: 'Segment', value: 'B2C' }
          ],
          data: [
            { x: '2020-01-01', y: 20 },
            { x: '2020-02-01', y: 25 },
            { x: '2020-03-01', y: 45 },
            { x: '2020-04-01', y: 40 },
            { x: '2020-05-01', y: 39 },
            { x: '2020-06-01', y: 50 },
            { x: '2020-07-01', y: 55 },
            { x: '2020-08-01', y: 60 },
            { x: '2020-09-01', y: 65 },
            { x: '2020-10-01', y: 70 },
            { x: '2020-11-01', y: 75 },
            { x: '2020-12-01', y: 80 },
            { x: '2021-01-01', y: 85 },
            { x: '2021-02-01', y: 90 },
            { x: '2021-03-01', y: 95 },
            { x: '2021-04-01', y: 100 },
            { x: '2021-05-01', y: 105 },
            { x: '2021-06-01', y: 110 },
            { x: '2021-07-01', y: 115 },
            { x: '2021-08-01', y: 120 },
            { x: '2021-09-01', y: 125 },
            { x: '2021-10-01', y: 130 },
            { x: '2021-11-01', y: 135 },
            { x: '2021-12-01', y: 140 },
          ]
        }
      ]
    },
    /*
    {
      chartType: 'line',
      xaxisType: 'datetime',
      group: 'sales',
      availableFilters: {},
      activeFilters: {},
      annotations: {},
      series: [
        {
          name: 'Category Sales',
          hidden: false,
          filterValues: {},
          data: [
            { x: '2020-01-01', y: 100 },
            { x: '2020-02-01', y: 200 },
            { x: '2020-03-01', y: 300 },
            { x: '2020-04-01', y: 400 },
            { x: '2020-05-01', y: 500 },
            { x: '2020-06-01', y: 600 },
            { x: '2020-07-01', y: 700 },
            { x: '2020-08-01', y: 800 },
            { x: '2020-09-01', y: 900 },
            { x: '2020-10-01', y: 1000 },
            { x: '2020-11-01', y: 1100 },
            { x: '2020-12-01', y: 1200 },
            { x: '2021-01-01', y: 1300 },
            { x: '2021-02-01', y: 1400 },
            { x: '2021-03-01', y: 1500 },
            { x: '2021-04-01', y: 1600 },
            { x: '2021-05-01', y: 1700 },
            { x: '2021-06-01', y: 1800 },
            { x: '2021-07-01', y: 1900 },
            { x: '2021-08-01', y: 2000 },
            { x: '2021-09-01', y: 2100 },
            { x: '2021-10-01', y: 2200 },
            { x: '2021-11-01', y: 2300 },
            { x: '2021-12-01', y: 2400 },
          ]
        }
      ]
    }*/
  ];

  return (
    <PageTemplate>
      <Carousel images={images} />

      <div className="@container mx-auto">
        <div className="p-4">
          <IndicatorDropdowns
            currentDomain={domainObj}
            currentSubdomain={subdomainObj}
            currentIndicator={indicatorObj}
            onIndicatorChange={handleIndicatorChange}
            allowSubdomainClear={false}
          />
        </div>
        <h2 className="text-2xl font-bold mt-16">{indicatorObj.nome}</h2>

        <div className="mt-12">
          <Indicator charts={exampleCharts} />
        </div>

        <div className="mt-8 @2xl:mx-32 container">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-4">
                <span className="font-semibold">Subdomain</span><br />
                {subdomainName}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Category</span><br />
                {indicatorObj.categorizacao}
              </p>
            </div>
            <div>
              <p className="mb-4">
                <span className="font-semibold">Measurement Unit</span><br />
                {indicatorObj.caracteristicas.unidade_de_medida}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Source</span><br />
                {indicatorObj.caracteristicas.fonte}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Periodicity</span><br />
                {indicatorObj.caracteristicas.periodicidade}
              </p>
            </div>
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
