import { useParams, useNavigate } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useState, useEffect } from "react";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns";
import Indicator from "../components/Indicator";
import { indicatorService } from "../services/indicatorService";

export default function IndicatorTemplate() {
  const { indicatorId } = useParams();
  const { domains } = useDomain();
  const navigate = useNavigate();
  
  const [indicator, setIndicator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIndicator = async () => {
      if (!indicatorId) {
        setError("Indicator ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const indicatorData = await indicatorService.getById(indicatorId);
        setIndicator(indicatorData);
        setError(null);
      } catch (err) {
        console.error("Error fetching indicator:", err);
        setError("Failed to load indicator");
      } finally {
        setLoading(false);
      }
    };

    fetchIndicator();
  }, [indicatorId]);

  if (loading) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading indicator...</div>
        </div>
      </PageTemplate>
    );
  }

  if (error || !indicator) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">{error || "Indicador não encontrado."}</div>
        </div>
      </PageTemplate>
    );
  }

  if (!indicator.domain) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Domínio não encontrado.</div>
        </div>
      </PageTemplate>
    );
  }

  // Find domain for carousel images and dropdown compatibility
  const domainObj = domains.find((dom) => {
    // Handle both old structure (nome) and new structure (name)
    const domainNameFromContext = dom.nome || dom.name;
    return domainNameFromContext === indicator.domain.name;
  });

  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    navigate(`/indicator/${newIndicator.id}`);
  };

  // Use domain images if available from context, fallback to default
  const images = domainObj?.DomainCarouselImages || [];

  // Example chart data
  const exampleCharts = [
    {
      chartType: 'line',
      xaxisType: 'datetime',
      group: 'sales',
      availableFilters: [
        {
          label: 'Segment',
          values: ['B2B', 'B2C']
        }
      ],
      activeFilters: [
        {
          label: 'Segment',
          values: ['B2B']
        }
      ],
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
  ];

  return (
    <PageTemplate>
      <Carousel images={images} />

      <div className="@container mx-auto">
        <div className="p-4">
          {domainObj && (
          <IndicatorDropdowns
            currentDomain={domainObj}
              currentSubdomain={indicator.subdomain}
              currentIndicator={indicator}
            onIndicatorChange={handleIndicatorChange}
            allowSubdomainClear={false}
          />
          )}
        </div>
        <h2 className="text-2xl font-bold mt-16">{indicator.name}</h2>

        <div className="mt-12">
          <Indicator charts={exampleCharts} />
        </div>

        <div className="mt-8 @2xl:mx-32 container">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-4">
                <span className="font-semibold">Subdomain</span><br />
                {indicator.subdomain || 'N/A'}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Domain</span><br />
                {indicator.domain.name}
              </p>
            </div>
            <div>
              <p className="mb-4">
                <span className="font-semibold">Measurement Unit</span><br />
                {indicator.scale || 'N/A'}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Source</span><br />
                {indicator.font || 'N/A'}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Periodicity</span><br />
                {indicator.periodicity || 'N/A'}
              </p>
            </div>
          </div>
          
          {indicator.description && (
            <div className="mt-6">
              <p className="mb-4">
                <span className="font-semibold">Description</span><br />
                {indicator.description}
              </p>
            </div>
          )}
        </div>

      </div>
    </PageTemplate>
  );
}
