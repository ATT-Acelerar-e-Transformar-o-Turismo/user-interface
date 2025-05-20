import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import GChart from './Chart';

export default function IndicatorCard({ IndicatorTitle, IndicatorId }) {
    let domainColor = "purple"; // Default color
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const { domains } = useDomain();

    // Sample chart data for preview
    const previewChartData = {
        chartType: 'line',
        xaxisType: 'datetime',
        series: [
            {
                name: 'Sample Data',
                hidden: false,
                data: [
                    { x: '2024-01-01', y: 30 },
                    { x: '2024-02-01', y: 40 },
                    { x: '2024-03-01', y: 35 },
                    { x: '2024-04-01', y: 50 }
                ]
            }
        ]
    };

    let selectedDomain = null;
    let selectedSubdomain = null;

    for (const domain of domains) {
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
                domainName: selectedDomain.nome,
                subdomainName: selectedSubdomain.nome,
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

    return (
        <div className="card bg-base-100 w-96 shadow-sm" style={{ border: `2px solid ${domainColor}` }}>
            <button className="flex justify-end mt-6 mr-10" onClick={toggleFavorite}>
                <FontAwesomeIcon 
                    icon={isFavorite ? faSolidHeart : faRegularHeart} 
                    className={`text-2xl btn btn-ghost ${isFavorite ? 'text-red-500' : ''}`}
                />
            </button>
            <div className="w-full flex justify-center items-center" style={{marginBottom: 0, paddingBottom: 0}}>
                <GChart 
                    {...previewChartData}
                    height={200}
                    chartId={`preview-${IndicatorId}`}
                    tooltip={false}
                    toolbar={false}
                />
            </div>
            <div className="card-body items-center text-center">
                <h2 className="card-title">{IndicatorTitle}</h2>
                <div className="card-actions">
                    <button 
                        className="btn" 
                        style={{ background: domainColor }} 
                        onClick={handleClick}
                        >
                            Ver indicador
                    </button>
                </div>
            </div>
        </div>
    );
}
