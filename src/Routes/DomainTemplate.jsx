import Carousel from "../components/Carousel";
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

    return (
        <>
            <PageTemplate>
                <Carousel images={images} />
                <div className="p-4">
                    <Dropdowns initialDomain={selectedDomainObj} />
                </div>
            </PageTemplate>
        </>
    )
}