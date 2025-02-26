import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import domains from "../../public/domains.json";
import PageTemplate from "./PageTemplate";
import Carousel from "../components/Carousel";
import IndicatorDropdowns from "../components/IndicatorDropdowns"; // the new component

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

  // This is called once the user picks a new indicator from the 3rd dropdown
  const handleIndicatorChange = (newDomain, newSubdomain, newIndicator) => {
    // "Commit" the new selection by navigating
    navigate(`/indicator/${newIndicator.id}`, {
      state: {
        domainName: newDomain.nome,
        subdomainName: newSubdomain.nome,
        indicatorId: newIndicator.id,
      },
    });
  };

 const images = domainObj.DomainCarouselImages;

  return (
    <PageTemplate>
      <Carousel images={images} />

      <div className="p-4">
        <IndicatorDropdowns
          currentDomain={domainObj}
          currentSubdomain={subdomainObj}
          currentIndicator={indicatorObj}
          onIndicatorChange={handleIndicatorChange}
          allowSubdomainClear={false}
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold">{indicatorObj.nome}</h1>
        <p>
          <strong>Subdomain:</strong> {subdomainName}
        </p>
        <p>
          <strong>Category:</strong> {indicatorObj.categorizacao}
        </p>
        <p>
          <strong>Measurement Unit:</strong>{" "}
          {indicatorObj.caracteristicas.unidade_de_medida}
        </p>
        <p>
          <strong>Source:</strong> {indicatorObj.caracteristicas.fonte}
        </p>
        <p>
          <strong>Periodicity:</strong> {indicatorObj.caracteristicas.periodicidade}
        </p>
      </div>
    </PageTemplate>
  );
}
