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
        colors: ['#009367'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            type: 'datetime',
            tooltip: { enabled: false }
        },
        tooltip: {
            x: { format: 'dd MMM yyyy' }
        },
        grid: {
            borderColor: '#f3f4f6',
            strokeDashArray: 4,
        }
    };

    const series = [{
        name: indicator.name,
        data: data.map(p => ({ x: new Date(p.x).getTime(), y: p.y }))
    }];

    return (
        <div className="my-8 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white not-prose">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 m-0 text-sm uppercase tracking-wide">
                    {indicator.name}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {indicator.periodicity}
                    </span>
                    <Link
                        to={`/indicator/${indicatorId}`}
                        className="text-2xl hover:opacity-80 transition-opacity"
                        style={{ color: '#009367', textDecoration: 'none' }}
                    >
                        ↗
                    </Link>
                </div>
            </div>

            <div className="p-6">
                {vizType === 'value' && (
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900" style={{ color: '#009367' }}>
                            {typeof lastValue === 'number' ? lastValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : lastValue}
                            <span className="text-xl text-gray-500 ml-1">{unit}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Última atualização: {data.length > 0 ? new Date(data[data.length - 1].x).toLocaleDateString('pt-BR') : '-'}</p>
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
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sem dados para exibir
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {indicator.description && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                   {indicator.description}
                </div>
            )}
        </div>
    );
}
