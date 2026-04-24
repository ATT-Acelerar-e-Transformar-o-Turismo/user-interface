import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { faHeart as faSolidHeart, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import { useState, useEffect } from "react";
import { useArea } from "../contexts/AreaContext";
import Chart from "./Chart";
import useIndicatorData from "../hooks/useIndicatorData";
import useLocalizedName from "../hooks/useLocalizedName";
import PropTypes from "prop-types";

export default function IndicatorCard({ IndicatorTitle, IndicatorId, area, dimension, description, description_en, unit, hidden = false, onToggleHidden, isAdmin = false, defaultChartType = 'line' }) {
    const { t } = useTranslation();
    const getName = useLocalizedName();
    const localizedDescription = getName.field({ description, description_en }, 'description', 'description_en');
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hearts, setHearts] = useState([]);
    const [indicatorData] = useState(null);
    const { areas } = useArea();
    
    // Use the custom hook to fetch indicator data
    const { data: chartData, loading: dataLoading } = useIndicatorData(IndicatorId, IndicatorTitle);

    // Find the area for this indicator
    const selectedArea = areas.find(d => d.name === area);
    const areaColor = selectedArea?.color || "#9ca3af";

    // Check localStorage on component mount
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favoriteIndicators')) || [];
        setIsFavorite(favorites.includes(IndicatorId));
    }, [IndicatorId]);

    const handleClick = () => {
        navigate(`/indicator/${IndicatorId}`, {
            state: { 
                indicatorId: IndicatorId, 
                areaName: selectedArea?.name || "Unknown Area",
                dimensionName: dimension, // Just pass the dimension as is
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
            className={`bg-base-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 group w-full cursor-pointer relative flex flex-col gap-6 p-8 ${hidden ? 'opacity-50' : ''}`}
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
                    color: #ef4444;
                    z-index: 50;
                }
            `}</style>
            <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                {isAdmin && onToggleHidden && (
                    <button
                        className="p-2 hover:bg-base-200 rounded-lg transition-colors"
                        onClick={(e) => { e.stopPropagation(); onToggleHidden(e); }}
                        title={hidden ? t('admin.indicators.show') : t('admin.indicators.hide')}
                    >
                        <FontAwesomeIcon
                            icon={hidden ? faEyeSlash : faEye}
                            className={`text-lg ${hidden ? 'text-base-content/40' : 'text-base-content/60 hover:text-base-content'}`}
                        />
                    </button>
                )}
                <button
                    className="p-2 hover:bg-base-200 rounded-lg transition-colors relative"
                    onClick={toggleFavorite}
                >
                    <FontAwesomeIcon
                        icon={isFavorite ? faSolidHeart : faRegularHeart}
                        className={`text-lg transform transition-transform duration-100 ${isFavorite ? 'text-error' : 'text-base-content/60 hover:text-error'} ${isAnimating ? 'scale-125' : ''}`}
                    />
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
                </button>
            </div>

            <div className="flex flex-col gap-4 w-full">
                {dataLoading ? (
                    <div className="flex items-center justify-center h-[220px]">
                        <div className="loading loading-spinner loading-md text-primary"></div>
                    </div>
                ) : chartData?.series?.[0]?.data?.length > 0 ? (
                    <div className="h-[220px] w-full">
                        <Chart
                            chartId={`preview-${IndicatorId}`}
                            chartType={defaultChartType || 'line'}
                            xaxisType="datetime"
                            series={chartData.series}
                            height={220}
                            showLegend={false}
                            showToolbar={false}
                            showTooltip={false}
                            allowUserInteraction={false}
                            compact={true}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[220px] bg-base-200 rounded-lg">
                        <div className="text-center text-base-content/60">
                            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div className="text-xs">{t('components.indicator_card.no_data')}</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full">
                <h3 className="font-['Onest'] font-semibold text-[20px] text-[#0a0a0a] tracking-[-0.4px] leading-[1.09] line-clamp-3">
                    {indicatorData?.name || IndicatorTitle}
                </h3>
                <div className="flex items-center justify-between w-full">
                    {unit && (
                        <span className="font-['Onest'] text-sm text-[#0a0a0a] tracking-[0.07px] leading-[21px]">
                            ({unit})
                        </span>
                    )}
                    {area && (
                        <span
                            className="px-2 py-[3px] min-h-6 rounded-full flex items-center justify-center font-['Onest'] font-medium text-xs text-white tracking-[0.18px] leading-4"
                            style={{ backgroundColor: areaColor }}
                        >
                            {area}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

IndicatorCard.propTypes = {
    IndicatorTitle: PropTypes.string.isRequired,
    IndicatorId: PropTypes.string.isRequired,
    area: PropTypes.string,
    dimension: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            name: PropTypes.string
        })
    ]),
    description: PropTypes.string,
    description_en: PropTypes.string,
    unit: PropTypes.string,
    hidden: PropTypes.bool,
    onToggleHidden: PropTypes.func,
    isAdmin: PropTypes.bool
};
