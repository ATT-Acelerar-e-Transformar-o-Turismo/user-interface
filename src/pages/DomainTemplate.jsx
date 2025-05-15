import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useDomain } from "../contexts/DomainContext";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";

export default function DomainTemplate() {
  const location = useLocation();
  const { domainName } = location.state || {};
  const { domains } = useDomain();
  const selectedDomainObj = domains.find((dom) => dom.nome === domainName);

  if (!selectedDomainObj) {
    return <div>Domínio não encontrado.</div>;
  }

  const images = selectedDomainObj.DomainCarouselImages;
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);

  // Graph icons
  const GraphTypes = [
    { icon: "📊" },
    { icon: "📈" },
    { icon: "📉" },
    { icon: "📈" },
    { icon: "📉" },
  ];

  const indicatorsToShow = selectedSubdomain
    ? selectedSubdomain.indicadores
    : selectedDomainObj.subdominios.flatMap((subdom) => subdom.indicadores);

  return (
    <PageTemplate>
      <Carousel images={images} />
      <div className="p-4">
        <Dropdowns
          initialDomain={selectedDomainObj}
          setSelectedSubdomain={setSelectedSubdomain}
          showIndicatorDropdown={false}
          redirectOnDomainChange={true}
          allowSubdomainClear={true}  // or just omit, it defaults to true
        />
      </div>
      <div className="flex flex-wrap place-content-center gap-4">
        {indicatorsToShow.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            IndicatorTitle={indicator.nome}
            IndicatorId={indicator.id}
            GraphTypes={GraphTypes}
          />
        ))}
      </div>
    </PageTemplate>
  );
}
