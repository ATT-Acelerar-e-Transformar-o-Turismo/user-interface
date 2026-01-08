import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useDomain } from "../contexts/DomainContext";
import Chart from "./Chart";
import useIndicatorData from "../hooks/useIndicatorData";
import PropTypes from "prop-types";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, domain, subdomain, description, unit }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hearts, setHearts] = useState([]);
    const [indicatorData] = useState(null);
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
        navigate(`/indicator/${IndicatorId}`, {
            state: { 
                indicatorId: IndicatorId, 
                domainName: selectedDomain?.name || "Unknown Domain",
                subdomainName: subdomain, // Just pass the subdomain as is
            },
        });
    };

    const triggerHeartAnimation = () => {
        const newHeart = {
            id: Date.now(),
            style: {
                left: '50%',
                top: '50%',
                '--tx': `${Math.random() * 40 - 20}px`,
                '--rot': `${Math.random() * 60 - 30}deg`
            }
        };
        setHearts(prev => [...prev, newHeart]);
    };

    const removeHeart = (id) => {
        setHearts(prev => prev.filter(h => h.id !== id));
    };

    const toggleFavorite = (e) => {
        e.stopPropagation();
        
        // Animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 100);
        
        // Trigger floating hearts if adding to favorites
        if (!isFavorite) {
            triggerHeartAnimation();
            setTimeout(() => triggerHeartAnimation(), 100);
            setTimeout(() => triggerHeartAnimation(), 200);
        }
        
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
        <div 
            className="bg-base-100 rounded-2xl shadow-sm border border-base-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group w-full max-w-sm cursor-pointer relative"
            onClick={handleClick}
        >
            <style>{`
                @keyframes floatUpHeart {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; margin-top: 0px; }
                    50% { opacity: 1; }
                    100% { transform: translate(calc(-50% + var(--tx)), -50%) scale(1.5) rotate(var(--rot)); opacity: 0; margin-top: -60px; }
                }
                .floating-heart {
                    position: absolute;
                    pointer-events: none;
                    animation: floatUpHeart 1s ease-out forwards;
                    color: #ef4444; /* Tailwind red-500 */
                    z-index: 50;
                }
            `}</style>
            <div className="pt-3 px-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: domainColor }}
                        ></div>
                    </div>
                    <div className="relative">
                        <button
                            className="p-2 hover:bg-base-200 rounded-lg transition-colors relative z-10"
                            onClick={toggleFavorite}
                        >
                            <FontAwesomeIcon
                                icon={isFavorite ? faSolidHeart : faRegularHeart}
                                className={`text-lg transform transition-transform duration-100 ${isFavorite ? 'text-error' : 'text-base-content/60 hover:text-error'} ${isAnimating ? 'scale-125' : ''}`}
                            />
                        </button>
                        {hearts.map(heart => (
                            <div
                                key={heart.id}
                                className="floating-heart"
                                style={heart.style}
                                onAnimationEnd={() => removeHeart(heart.id)}
                            >
                                <FontAwesomeIcon icon={faSolidHeart} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-2 pb-2">
                {dataLoading ? (
                    <div className="flex items-center justify-center h-52 bg-base-200 rounded-lg mx-2">
                        <div className="loading loading-spinner loading-md text-primary"></div>
                    </div>
                ) : chartData?.series?.[0]?.data?.length > 0 ? (
                    <div className="h-52 mx-2">
                        <Chart
                            chartId={`preview-${IndicatorId}`}
                            chartType="line"
                            xaxisType="datetime"
                            series={chartData.series}
                            height={208}
                            showLegend={false}
                            showToolbar={false}
                            showTooltip={false}
                            allowUserInteraction={false}
                            compact={true}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-52 bg-base-200 rounded-lg mx-2">
                        <div className="text-center text-base-content/60">
                            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div className="text-xs">Sem dados</div>
                        </div>
                    </div>
                )}
            </div>
            <div className="px-6 pb-6">
                <h3 className="text-lg font-semibold text-base-content mb-3 font-['Onest',sans-serif] line-clamp-2">
                    {indicatorData?.name || IndicatorTitle} {unit && <span className="text-sm text-base-content/70">({unit})</span>}
                </h3>
                {description && (
                  <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                    {description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-sm text-base-content/70">
                    {domain && (
                        <span className="px-2 py-1 bg-base-200 rounded-md">{domain}</span>
                    )}
                    {subdomain && (
                        <span className="px-2 py-1 bg-base-200 rounded-md">{subdomain}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

IndicatorCard.propTypes = {
    IndicatorTitle: PropTypes.string.isRequired,
    IndicatorId: PropTypes.string.isRequired,
    domain: PropTypes.string,
    subdomain: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            name: PropTypes.string
        })
    ]),
    description: PropTypes.string,
    unit: PropTypes.string
};
