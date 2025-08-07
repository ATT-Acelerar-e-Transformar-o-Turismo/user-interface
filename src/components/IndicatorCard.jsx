import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import Chart from "./Chart";
import useIndicatorData from "../hooks/useIndicatorData";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes, domain, subdomain }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const { domains } = useDomain();
    
    // Use the custom hook to fetch indicator data
    const { data: chartData, loading: dataLoading } = useIndicatorData(IndicatorId, IndicatorTitle);

    // Find the domain for this indicator
    const selectedDomain = domains.find(d => d.name === domain) || domains[0];
    const domainColor = selectedDomain?.color || "purple";

    // Check localStorage on component mount
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
        setIsFavorite(favorites.includes(IndicatorId));
    }, [IndicatorId]);

    const handleClick = () => {
        if (!selectedDomain) {
            console.error("Domain not found for Indicator ID:", IndicatorId);
            return;
        }

        navigate(`/indicator/${IndicatorId}`, {
            state: { 
                indicatorId: IndicatorId, 
                domainName: selectedDomain.name,
                subdomainName: subdomain, // Just pass the subdomain as is
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
            <figure>
                {dataLoading ? (
                    <div className="flex items-center justify-center h-52">
                        <div className="loading loading-spinner loading-md"></div>
                    </div>
                ) : chartData?.series?.[0]?.data?.length > 0 ? (
                    <Chart
                        chartId={`preview-${IndicatorId}`}
                        chartType="line"
                        xaxisType="datetime"
                        series={chartData.series}
                        height={220}
                        showLegend={false}
                        showToolbar={false}
                        showTooltip={false}
                        allowUserInteraction={false}
                    />
                ) : (
                    <div className="flex items-center justify-center h-52">
                        <div className="text-center text-gray-500">
                            <div className="text-sm">No data available</div>
                        </div>
                    </div>
                )}
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
