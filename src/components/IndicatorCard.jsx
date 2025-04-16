import domains from "../../public/domains.json";
import { useNavigate } from "react-router-dom";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes }) {
    let domainColor = "purple"; // Default color
    const navigate = useNavigate();

    let selectedDomain = null;
    let selectedSubdomain = null;

    for (const domain of domains.dominios) {
        for (const subdomain of domain.subdominios) {
            if (subdomain.indicadores.some(indicator => indicator.id === IndicatorId)) {
                domainColor = domain.DomainColor;
                selectedDomain = domain;
                selectedSubdomain = subdomain;
                break;
            }
        }
        if (selectedDomain) break;
    }

    const handleClick = () => {
        if (!selectedDomain || !selectedSubdomain) {
            console.error("Domain or Subdomain not found for Indicator ID:", IndicatorId);
            return;
        }

        navigate(`/indicator/${IndicatorId}`, {
            state: { 
                indicatorId: IndicatorId, 
                domainName: selectedDomain.nome,
                subdomainName: selectedSubdomain.nome,
            },
        });
    };

    return (
        <div className="card bg-base-100 w-96 shadow-sm" style={{ border: `2px solid ${domainColor}` }}>
            <figure className="px-10 pt-10">
                <img src="/graph.png" alt="Graph" className="rounded-xl" />
            </figure>
            <div className="card-body items-center text-center">
                <h2 className="card-title">{IndicatorTitle}</h2>
                <div className="card-actions">
                    {GraphTypes.map((graphType, index) => (
                        <button 
                            key={index} 
                            className="btn" 
                            style={{ background: domainColor }} 
                            onClick={handleClick}
                        >
                            {graphType.icon}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
