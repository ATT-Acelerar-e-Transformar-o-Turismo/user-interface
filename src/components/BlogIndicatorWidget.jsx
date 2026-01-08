import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import indicatorService from '../services/indicatorService';
import LoadingSkeleton from './LoadingSkeleton';

export default function BlogIndicatorWidget({ indicatorId, vizType }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [indicator, setIndicator] = useState(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (indicatorId) {
            loadData();
        }
    }, [indicatorId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [indicatorData, pointsData] = await Promise.all([
                indicatorService.getById(indicatorId),
                indicatorService.getData(indicatorId, null, null, 50) // Get last 50 points
            ]);
            
            setIndicator(indicatorData);
            // Sort data by date ascending for charts
            setData(pointsData.sort((a, b) => new Date(a.x) - new Date(b.x)));
        } catch (err) {
            console.error("Error loading indicator widget:", err);
            setError("Não foi possível carregar os dados do indicador.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="my-4 p-4 border rounded bg-gray-50"><LoadingSkeleton /></div>;
    if (error) return <div className="my-4 p-4 border border-red-200 rounded bg-red-50 text-red-600 text-sm">{error}</div>;
    if (!indicator) return null;

    const lastValue = data.length > 0 ? data[data.length - 1].y : 'N/A';
    const unit = indicator.unit || ''; // Assuming indicator has unit, or strictly use what's available

    // Chart Configuration
    const chartOptions = {
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit'
        },
        colors: ['var(--color-primary)'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            type: 'datetime',
            tooltip: { enabled: false },
            labels: { style: { colors: 'var(--color-base-content)' } }
        },
        yaxis: {
            labels: { style: { colors: 'var(--color-base-content)' } }
        },
        tooltip: {
            x: { format: 'dd MMM yyyy' },
            theme: 'light'
        },
        grid: {
            borderColor: 'var(--color-base-300)',
            strokeDashArray: 4,
        }
    };

    const series = [{
        name: indicator.name,
        data: data.map(p => ({ x: new Date(p.x).getTime(), y: p.y }))
    }];

    return (
        <div className="my-8 border border-base-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-base-100 not-prose">
            <div className="bg-base-200 px-4 py-2 border-b border-base-300 flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-base-content m-0 text-sm uppercase tracking-wide">
                        {indicator.name}
                    </h3>
                    <Link 
                        to={`/indicator/${indicator.id}`}
                        target="_blank"
                        className="text-base-content/50 hover:text-primary transition-colors"
                        title="Abrir indicador"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                </div>
                <span className="text-xs text-base-content/70 bg-base-100 border border-base-300 px-2 py-1 rounded-full">
                    {indicator.periodicity}
                </span>
            </div>

            <div className="p-6">
                {vizType === 'value' && (
                    <div className="text-center">
                        <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                            {typeof lastValue === 'number' ? lastValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : lastValue}
                            <span className="text-xl text-base-content/60 ml-1">{unit}</span>
                        </div>
                        <p className="text-sm text-base-content/70 my-2">Última atualização: {data.length > 0 ? new Date(data[data.length - 1].x).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                )}

                {(vizType === 'line' || vizType === 'bar') && (
                    <div className="h-64 w-full">
                        {data.length > 0 ? (
                            <ReactApexChart
                                options={chartOptions}
                                series={series}
                                type={vizType}
                                height="100%"
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-base-content/40">
                                Sem dados para exibir
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {indicator.description && (
                <div className="px-4 py-3 bg-base-200 border-t border-base-300 text-xs text-base-content/70">
                   {indicator.description}
                </div>
            )}
        </div>
    );
}
