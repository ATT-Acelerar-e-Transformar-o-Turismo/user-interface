import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import Chart from "./Chart";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes }) {
    let domainColor = "purple"; // Default color
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const { domains } = useDomain();

    let selectedDomain = null;
    let selectedSubdomain = null;

    // Handle both old JSON structure and new API structure
    for (const domain of domains) {
        if (domain.subdominios && Array.isArray(domain.subdominios)) {
            // Old structure
        for (const subdomain of domain.subdominios) {
                if (subdomain.indicadores && subdomain.indicadores.some(indicator => indicator.id === IndicatorId)) {
                    domainColor = domain.DomainColor || domain.color;
                selectedDomain = domain;
                selectedSubdomain = subdomain;
                break;
                }
            }
        } else {
            // New API structure - for now, just use the first domain as fallback
            // In a real implementation, you'd get indicator-domain relationships from the API
            if (!selectedDomain) {
                selectedDomain = domain;
                selectedSubdomain = { nome: domain.subdomains?.[0] || 'Default' };
                domainColor = domain.color || domain.DomainColor;
            }
        }
        if (selectedDomain) break;
    }

    // Check localStorage on component mount
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
        setIsFavorite(favorites.includes(IndicatorId));
    }, [IndicatorId]);

    const handleClick = () => {
        if (!selectedDomain || !selectedSubdomain) {
            console.error("Domain or Subdomain not found for Indicator ID:", IndicatorId);
            return;
        }

        navigate(`/indicator/${IndicatorId}`, {
            state: { 
                indicatorId: IndicatorId, 
                domainName: selectedDomain.nome || selectedDomain.name,
                subdomainName: selectedSubdomain.nome || selectedSubdomain.name || selectedSubdomain,
            },
        });
    };

    const toggleFavorite = (e) => {
        e.stopPropagation();
        
        // Get current favorites from localStorage
        const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
        
        let updatedFavorites;
        if (isFavorite) {
            updatedFavorites = favorites.filter(id => id !== IndicatorId);
        } else {
            updatedFavorites = [...favorites, IndicatorId];
        }
        
        localStorage.setItem('favoriteIndicators', JSON.stringify(updatedFavorites));
        
        // Dispatch storage event to notify other components
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'favoriteIndicators',
            newValue: JSON.stringify(updatedFavorites),
            url: window.location.href
        }));
        
        // Update state
        setIsFavorite(!isFavorite);
    };

    // Sample data for preview
    const previewData = {
        series: [{
            name: 'Sample Data',
            data: [
                { x: 1, y: 10 },
                { x: 2, y: 15 },
                { x: 3, y: 12 },
                { x: 4, y: 18 },
                { x: 5, y: 14 }
            ]
        }]
    };

    return (
        <div className="card bg-base-100 w-96 shadow-sm" style={{ border: `2px solid ${domainColor}` }}>
            <button className="flex justify-end mt-6 mr-10" onClick={toggleFavorite}>
                <FontAwesomeIcon 
                    icon={isFavorite ? faSolidHeart : faRegularHeart} 
                    className={`text-2xl btn btn-ghost ${isFavorite ? 'text-red-500' : ''}`}
                />
            </button>
            <figure>
                <Chart
                    chartId={`preview-${IndicatorId}`}
                    chartType="line"
                    xaxisType="numeric"
                    series={previewData.series}
                    height={220}
                    showLegend={false}
                    showToolbar={false}
                    showTooltip={false}
                    allowUserInteraction={false}
                />
            </figure>
            <div className="card-body pt-1 items-center text-center">
                <h2 className="card-title">{IndicatorTitle}</h2>
                <div className="card-actions">
                    <button 
                        className="btn" 
                        style={{ background: domainColor }}
                        onClick={handleClick}
                    >
                        Ver Indicador
                    </button>
                </div>
            </div>
        </div>
    );
}
