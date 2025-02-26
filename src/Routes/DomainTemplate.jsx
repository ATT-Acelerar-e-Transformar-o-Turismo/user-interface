import Carousel from "../components/Carousel";
import IndicatorCard from "../components/IndicatorCard";
import Dropdowns from "../components/DomainDropdown";
import PageTemplate from "./PageTemplate";
import { useLocation } from 'react-router-dom';
import domains from '../../public/domains.json';

export default function DomainTemplate() {

    const location = useLocation();
    const { domainName } = location.state || {};

    const selectedDomainObj = domains.dominios.find(
        (dom) => dom.nome === domainName
    );

    if (!selectedDomainObj) {
        return <div>Domínio não encontrado.</div>;
    }


    const images =selectedDomainObj.DomainCarouselImages;

    const GraphTypes = [
        { icon: "📊" },
        { icon: "📈" },
        { icon: "📉" },
        { icon: "📈" },
        { icon: "📉" },
    ];

    return (
        <>
            <PageTemplate>
                <Carousel images={images} />
                <div className="p-4">
                    <Dropdowns initialDomain={selectedDomainObj} />
                </div>
                <div className=" mx-60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ">
                    {selectedDomainObj.subdominios.map((subdom) => (
                        <IndicatorCard 
                            key={subdom.id}
                            IndicatorTitle={subdom.nome} 
                            IndicatorId={subdom.id}
                            GraphTypes={GraphTypes }
                        />
                    ))}
                </div>
            </PageTemplate>
        </>
    )
}