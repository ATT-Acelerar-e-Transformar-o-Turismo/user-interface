import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import { useIndicator } from "../contexts/IndicatorContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns"; // the new component
import Indicator from "../components/Indicator";
import useIndicatorData from "../hooks/useIndicatorData";

export default function IndicatorTemplate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { indicatorId } = useParams(); // Extract from URL params
  const { domainName, subdomainName } = location.state || {};
  const { domains } = useDomain();
  const { indicators, getIndicatorById, loading } = useIndicator();

  // Move the hook to the top level, before any conditional returns
  const { data: chartData, loading: dataLoading } = useIndicatorData(indicatorId, "Indicator Data");

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

  // 1) Find the indicator from indicators context first
  const indicatorObj = getIndicatorById(indicatorId);
  if (!indicatorObj) return <div>Indicator not found.</div>;

  // 2) Find the domain from domains context
  let domainObj = domains.find((dom) => dom.name === domainName);
  
  // If domainName is not available, try to get domain from indicator data
  if (!domainObj && indicatorObj) {
    domainObj = domains.find((dom) => dom.id === indicatorObj.domain || dom.name === indicatorObj.domain?.name);
  }
  
  if (!domainObj) return <div>Domain not found.</div>;

  // 3) Get subdomain name from indicator data
  const currentSubdomainName = subdomainName || indicatorObj.subdomain;

  // The user sees this domain/subdomain/indicator on screen
  // until they pick a new indicator in the dropdown.

  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    navigate(`/indicator/${newIndicator.id}`, {
      state: {
        domainName: newDomain.name,
        subdomainName: newSubdomain.name,
        indicatorId: newIndicator.id,
      },
    });
  };

  const images = domainObj.DomainCarouselImages;

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
          <IndicatorDropdowns
            currentDomain={domainObj}
            currentSubdomain={{ name: currentSubdomainName }}
            currentIndicator={indicatorObj}
            onIndicatorChange={handleIndicatorChange}
            allowSubdomainClear={false}
          />
        </div>
        <h2 className="text-2xl font-bold mt-16">{indicatorObj.name}</h2>

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
                <div className="text-sm">This indicator doesn't have any data yet.</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 @2xl:mx-32 container">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-4">
                <span className="font-semibold">Subdomain</span><br />
                {currentSubdomainName}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Category</span><br />
                {indicatorObj.categorization || "Destination-specific indicators"}
              </p>
            </div>
            <div>
              <p className="mb-4">
                <span className="font-semibold">Measurement Unit</span><br />
                {indicatorObj.characteristics?.unit_of_measure || indicatorObj.unit_of_measure || "N/A"}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Source</span><br />
                {indicatorObj.characteristics?.source || indicatorObj.font || indicatorObj.source || "N/A"}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Periodicity</span><br />
                {indicatorObj.characteristics?.periodicity || indicatorObj.periodicity || "N/A"}
              </p>
            </div>
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
