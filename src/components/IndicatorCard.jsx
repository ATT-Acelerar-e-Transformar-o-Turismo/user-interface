import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import { loadIndicatorData, getSampleData, getChartTypeForIndicator } from "../utils/excelLoader";
import Chart from "./Chart";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes }) {
    let domainColor = "purple"; // Default color
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [chartType, setChartType] = useState('line');
    const { domains } = useDomain();

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

    // Load chart data based on indicator ID
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            
            // Get chart type for this indicator
            const indicatorChartType = getChartTypeForIndicator(IndicatorId);
            setChartType(indicatorChartType);
            
            // Try to load real data for specific indicators (70, 71, 72, 2000, 2900)
            const realData = await loadIndicatorData(IndicatorId);
            
            if (realData) {
                setChartData(realData);
            } else {
                // Fall back to sample data for other indicators
                setChartData(getSampleData());
            }
            
            setIsLoading(false);
        };

        loadData();
    }, [IndicatorId]);

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
            <figure>
                {isLoading ? (
                    <div className="flex items-center justify-center h-[220px]">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : chartData ? (
                    <Chart
                        title=""
                        chartId={`preview-${IndicatorId}`}
                        chartType={chartType}
                        xaxisType="numeric"
                        series={chartData.series}
                        height={220}
                        showLegend={false}
                        showToolbar={false}
                        showTooltip={true}
                        allowUserInteraction={false}
                    />
                ) : (
                    <div className="flex items-center justify-center h-[220px] text-gray-500">
                        No data available
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
