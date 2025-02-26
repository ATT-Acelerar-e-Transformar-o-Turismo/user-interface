import { Link } from "react-router-dom";
import domains from "../../public/domains.json";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes }) {

    let domainColor = "#000"; // Default color

    for (const domain of domains.dominios) {
        for (const subdomain of domain.subdominios) {
            if (subdomain.indicadores.some(indicator => indicator.id === IndicatorId)) {
                domainColor = domain.DomainColor; // Get the color from the domain
                break;
            }
        }
    }

    return (
            <div className="card bg-base-100 w-96 shadow-sm">
                {/* get the domain color from domains by using the indicator id */}
                <Link
                    to={`/indicator/${IndicatorId}`}
                    className="card-body items-center text-center border-2 rounded-lg"
                    style={{ border: `2px solid ${domainColor}` }}
                >
                    <figure className="px-10 pt-10">
                        <img
                        src="../../public/graph.png"
                        alt="Shoes"
                        class="rounded-xl" />
                    </figure>
                    <div className="card-body items-center text-center">
                        <h2 className="card-title">{IndicatorTitle}</h2>
                        <div className="card-actions">
                            {GraphTypes.map((graphType) => (
                                <button className="btn " style={{background:`${domainColor}`}}>{graphType.icon}</button>
                            ))}
                        </div>
                    </div>
                </Link>
            </div>
    )
}

