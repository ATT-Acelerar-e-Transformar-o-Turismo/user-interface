import { useState } from "react";
import { useLocation } from "react-router-dom";
import domains from "../../public/domains.json";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import Dropdowns from "../components/DomainDropdown";
import IndicatorCard from "../components/IndicatorCard";

export default function DomainTemplate() {
  const location = useLocation();
  const { domainName } = location.state || {};
  const selectedDomainObj = domains.dominios.find((dom) => dom.nome === domainName);

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
      <div className="mx-60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
