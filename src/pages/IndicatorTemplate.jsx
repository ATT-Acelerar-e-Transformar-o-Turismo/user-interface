import { useNavigate, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useIndicator } from "../contexts/IndicatorContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns";
import Indicator from "../components/Indicator";
import indicatorService from "../services/indicatorService";
import { useState, useEffect } from "react";

import useIndicatorData from "../hooks/useIndicatorData";

export default function IndicatorTemplate() {
  const navigate = useNavigate();
  const { indicatorId } = useParams(); // Extract from URL params
  const { domains } = useDomain();

  const { getIndicatorById, loading } = useIndicator();

  // Move the hook to the top level, before any conditional returns
  const { data: chartData, loading: dataLoading } = useIndicatorData(indicatorId, "Indicator Data");
  const [indicatorData, setIndicatorData] = useState(null);
  const [error, setError] = useState(null);
  const [indicatorLoading, setIndicatorLoading] = useState(false);

  // Fetch indicator data from API (must be declared before any returns)
  useEffect(() => {
    const fetchIndicatorData = async () => {
      try {
        setIndicatorLoading(true);
        const data = await indicatorService.getById(indicatorId);
        setIndicatorData(data);
      } catch (err) {
        console.error("Failed to fetch indicator data:", err);
        setError(err.message);
      } finally {
        setIndicatorLoading(false);
      }
    };

    if (indicatorId) {
      fetchIndicatorData();
    }
  }, [indicatorId]);

  // Show loading state while indicators are being loaded
  if (loading) {
    return (
      <PageTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </PageTemplate>
    );
  }


  // Add loading state while domains are being fetched
  if (!domains || domains.length === 0) {
    return <div>Loading domains...</div>;
  }

  if (indicatorLoading) {
    return <div>Loading indicator...</div>;
  }

  if (error || !indicatorData) {
    return <div>Error: {error || 'Indicator not found'}</div>;
  }

  // Find domain information based on indicator data
  let resolvedDomainObj = indicatorData.domain ? 
    (typeof indicatorData.domain === 'object' ? indicatorData.domain : 
     domains.find(domain => domain.id === indicatorData.domain)) : null;

  // Ensure subdomains are in consistent object format { name: "subdomain" }
  if (resolvedDomainObj && resolvedDomainObj.subdomains) {
    resolvedDomainObj = {
      ...resolvedDomainObj,
      subdomains: resolvedDomainObj.subdomains.map(subdomain => 
        typeof subdomain === 'string' ? { name: subdomain } : subdomain
      )
    };
  }

  console.log('IndicatorTemplate - Domain resolution:', {
    indicatorDataDomain: indicatorData.domain,
    resolvedDomainObj,
    subdomains: resolvedDomainObj?.subdomains,
    subdomainTypes: resolvedDomainObj?.subdomains?.map(sub => typeof sub)
  });

  // Debug logging removed for cleaner output

  if (!resolvedDomainObj) {
    return <div>Domain not found for indicator.</div>;
  }

  const resolvedSubdomainName = indicatorData.subdomain || 'Unknown Subdomain';

  // Find subdomain object - all subdomains should now be objects with name property
  const subdomainObj = resolvedDomainObj.subdomains?.find((sub) => sub.name === resolvedSubdomainName);
  
  if (!subdomainObj) {
    console.warn('Subdomain not found in domain subdomains:', {
      resolvedSubdomainName,
      availableSubdomains: resolvedDomainObj.subdomains
    });
    // Create a mock subdomain object instead of failing
    // This allows the component to render while debugging
  }

  // Try to find indicator in subdomain, but don't fail if not found
  // This is expected since we're using API data
  // The user sees this domain/subdomain/indicator on screen
  // until they pick a new indicator in the dropdown.

  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    navigate(`/indicator/${newIndicator.id}`, {
      state: {
        domainName: newDomain.name,
        subdomainName: typeof newSubdomain === 'string' ? newSubdomain : newSubdomain.name,
        indicatorId: newIndicator.id,
      },
    });
  };

  const images = resolvedDomainObj.DomainCarouselImages || [];

  // Transform real data to chart format
  const realCharts = [
    {
      chartType: 'line',
      xaxisType: 'datetime',
      group: 'indicator',
      availableFilters: [],
      activeFilters: [],
      annotations: {
        xaxis: [],
        yaxis: []
      },
      series: chartData?.series || []
    }
  ];

  return (
    <PageTemplate>
      <Carousel images={images} />

      <div className="@container mx-auto">
        <div className="p-4">
          {resolvedDomainObj && (
            <IndicatorDropdowns
              currentDomain={resolvedDomainObj}
              currentSubdomain={subdomainObj || { name: resolvedSubdomainName }}
              currentIndicator={indicatorData}
              onIndicatorChange={handleIndicatorChange}
              allowSubdomainClear={false}
            />
          )}
        </div>
        <h2 className="text-2xl font-bold mt-16">{indicatorData.name}</h2>

        <div className="mt-12">
          {dataLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
           ) : chartData?.series?.[0]?.data?.length > 0 ? (
            <Indicator charts={realCharts} />
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-xl mb-2">No data available</div>
                <div className="text-sm">This indicator does not have any data yet.</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 @2xl:mx-32 container">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-4">
                <span className="font-semibold">Subdomain</span><br />
                {resolvedSubdomainName}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Category</span><br />
                {indicatorData.categorization || "Destination-specific indicators"}
              </p>
            </div>
            <div>
              <p className="mb-4">
                <span className="font-semibold">Measurement Unit</span><br />
                {indicatorData.characteristics?.unit_of_measure || indicatorData.unit_of_measure || "N/A"}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Source</span><br />
                {indicatorData.characteristics?.source || indicatorData.font || indicatorData.source || "N/A"}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Periodicity</span><br />
                {indicatorData.characteristics?.periodicity || indicatorData.periodicity || "N/A"}
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
