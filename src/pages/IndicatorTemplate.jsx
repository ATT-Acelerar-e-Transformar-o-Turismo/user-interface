import { useParams, useNavigate } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns";
import Indicator from "../components/Indicator";
import indicatorService from "../services/indicatorService";
import { useState, useEffect } from "react";


export default function IndicatorTemplate() {
  const { indicatorId } = useParams();
  const { domains } = useDomain();
  const navigate = useNavigate();
  const [indicatorData, setIndicatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch indicator data from API
  useEffect(() => {
    const fetchIndicatorData = async () => {
      try {
        setLoading(true);
        const data = await indicatorService.getById(indicatorId);
        // console.log('Fetched indicator data:', data);
        setIndicatorData(data);
      } catch (err) {
        console.error("Failed to fetch indicator data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (indicatorId) {
      fetchIndicatorData();
    }
  }, [indicatorId]);

  // Add loading state while domains are being fetched
  if (!domains || domains.length === 0) {
    return <div>Loading domains...</div>;
  }

  if (loading) {
    return <div>Loading indicator...</div>;
  }

  if (error || !indicatorData) {
    return <div>Error: {error || 'Indicator not found'}</div>;
  }

  // Find domain information based on indicator data
  const domainObj = indicatorData.domain ? 
    (typeof indicatorData.domain === 'object' ? indicatorData.domain : 
     domains.find(domain => (domain.id || domain._id) === indicatorData.domain)) : null;

  // Debug logging removed for cleaner output

  if (!domainObj) {
    return <div>Domain not found for indicator.</div>;
  }

  const subdomainName = indicatorData.subdomain || 'Unknown Subdomain';

  // Handle both string arrays and object arrays for subdomains
  let subdomainObj = null;
  if (Array.isArray(domainObj.subdomains)) {
    if (domainObj.subdomains.length > 0 && typeof domainObj.subdomains[0] === 'string') {
      // If subdomains is an array of strings, create a mock subdomain object
      subdomainObj = { name: subdomainName };
    } else {
      // If subdomains is an array of objects, find by name
      subdomainObj = domainObj.subdomains.find((sub) => sub.name === subdomainName);
    }
  }
  
  if (!subdomainObj) {
    return <div>Subdomain not found: {subdomainName}</div>;
  }

  // Try to find indicator in subdomain, but don't fail if not found
  // This is expected since we're using API data
  // The user sees this domain/subdomain/indicator on screen
  // until they pick a new indicator in the dropdown.

  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    navigate(`/indicator/${newIndicator.id || newIndicator._id}`, {
      state: {
        domainName: newDomain.name,
        subdomainName: typeof newSubdomain === 'string' ? newSubdomain : newSubdomain.name,
        indicatorId: newIndicator.id || newIndicator._id,
      },
    });
  };

  const images = domainObj.DomainCarouselImages || [];

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
            currentSubdomain={subdomainName}
            currentIndicator={indicatorData}
            onIndicatorChange={handleIndicatorChange}
            allowSubdomainClear={false}
          />
          )}
        </div>
        <h2 className="text-2xl font-bold mt-16">{indicatorData.name}</h2>

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
                {indicatorData.categorization || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-4">
                <span className="font-semibold">Measurement Unit</span><br />
                {indicatorData.scale || 'N/A'}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Source</span><br />
                {indicatorData.font || 'N/A'}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Periodicity</span><br />
                {indicatorData.periodicity || 'N/A'}
              </p>
            </div>
          </div>
          
          {indicatorData.description && (
            <div className="mt-6">
              <p className="mb-4">
                <span className="font-semibold">Description</span><br />
                {indicatorData.description}
              </p>
            </div>
          )}
        </div>

      </div>
    </PageTemplate>
  );
}
