import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import Chart from "./Chart";
import indicatorService from "../services/indicatorService";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, GraphTypes }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [indicatorData, setIndicatorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { domains } = useDomain();

    // Fetch indicator data from API
    useEffect(() => {
        const fetchIndicatorData = async () => {
            try {
                setLoading(true);
                const data = await indicatorService.getById(IndicatorId);
                setIndicatorData(data);
            } catch (err) {
                console.error("Failed to fetch indicator data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (IndicatorId) {
            fetchIndicatorData();
        }
    }, [IndicatorId]);

    // Find domain information based on indicator data
    const selectedDomain = indicatorData?.domain ? 
        (typeof indicatorData.domain === 'object' ? indicatorData.domain : 
         domains.find(domain => (domain.id || domain._id) === indicatorData.domain)) : null;
    
    const domainColor = selectedDomain?.color || selectedDomain?.DomainColor || "purple";
    const selectedSubdomain = indicatorData?.subdomain || 'Unknown Subdomain';

    // Check localStorage on component mount
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
        setIsFavorite(favorites.includes(IndicatorId));
    }, [IndicatorId]);

    const handleClick = () => {
        if (!indicatorData) {
            console.error("Indicator data not found for Indicator ID:", IndicatorId);
            return;
        }

        const domainName = selectedDomain?.name || 'Unknown Domain';
        const subdomainName = typeof selectedSubdomain === 'string' ? selectedSubdomain : selectedSubdomain?.name || 'Unknown Subdomain';

        navigate(`/indicator/${IndicatorId}`, {
            state: { 
                indicatorId: IndicatorId, 
                domainName: domainName,
                subdomainName: subdomainName,
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

    if (loading) {
        return (
            <div className="card bg-base-100 w-96 shadow-sm animate-pulse">
                <div className="card-body">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error || !indicatorData) {
        return (
            <div className="card bg-base-100 w-96 shadow-sm border-2 border-red-300">
                <div className="card-body">
                    <h3 className="text-red-600">Error loading indicator</h3>
                    <p className="text-sm text-gray-600">{error || 'Indicator not found'}</p>
                </div>
            </div>
        );
    }

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
                <h2 className="card-title">{indicatorData.name || IndicatorTitle}</h2>
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
