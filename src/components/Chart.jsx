import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import ApexCharts from 'apexcharts'

const DEFAULT_ANNOTATIONS = { xaxis: [], yaxis: [] }

// Global guard: ApexCharts has several internal promise chains (animations,
// zoom, updates) whose rejections we cannot intercept from the caller. A
// rejected internal promise becomes an "Uncaught (in promise)" and pollutes
// the console, and in some browsers counts as an app-level error. Swallow
// anything that originates from within Apex so a single bad chart can't make
// the whole page look broken; still log loudly enough to diagnose.
if (typeof window !== 'undefined' && !window.__apexUnhandledGuardInstalled) {
    window.__apexUnhandledGuardInstalled = true;
    window.addEventListener('unhandledrejection', (event) => {
        const err = event.reason;
        const stack = err && err.stack ? String(err.stack) : '';
        const msg = err && err.message ? String(err.message) : String(err);
        // Heuristic match: errors originating inside the apexcharts bundle
        // either reference 'apexcharts' or have the minified 'r.value' frames
        // we've seen at the top of the stack.
        const looksLikeApex = /apexcharts|apexcharts\.js|r\.value \(/.test(stack) || /apexcharts/i.test(msg);
        if (looksLikeApex) {
            console.warn('[Chart] Suppressed ApexCharts internal rejection:', err);
            event.preventDefault();
            return;
        }
        // Everything else: surface to the user as a toast so runtime errors
        // aren't silent. Axios errors already fire their own toast from the
        // response interceptor, so skip those.
        const isAxios = err && (err.isAxiosError || err.config || err.response);
        if (isAxios) return;
        try {
            // Lazy-require to avoid a circular import chain at module init.
            import('../utils/toast').then(({ showError }) => {
                showError(`Erro: ${msg}`, 7000);
            });
        } catch (_) { /* swallow */ }
    });

    window.addEventListener('error', (event) => {
        const msg = event?.error?.message || event?.message || '';
        if (!msg) return;
        try {
            import('../utils/toast').then(({ showError }) => {
                showError(`Erro: ${msg}`, 7000);
            });
        } catch (_) { /* swallow */ }
    });
}

const GChart = forwardRef(({ title, chartId, chartType, xaxisType, annotations = DEFAULT_ANNOTATIONS, log, series, group, height, themeMode = 'light', showLegend = true, showToolbar = true, showTooltip = true, allowUserInteraction = true, compact = false, minimalAxis = false, activeTool = 'pan', disableAnimations = false, onViewportChange, xaxisRange }, ref) => {
    const [labelColor, setLabelColor] = useState('var(--color-base-content)')
    const [options, setOptions] = useState({})
    const chartRef = useRef(null)
    const chartContainerRef = useRef(null)
    const onViewportChangeRef = useRef(onViewportChange)

    useImperativeHandle(ref, () => ({
        chart: chartRef.current
    }));

    useEffect(() => {
        onViewportChangeRef.current = onViewportChange;
    }, [onViewportChange]);

    useEffect(() => {
        const computedStyle = getComputedStyle(document.documentElement)
        const baseContentColor = computedStyle.getPropertyValue('--color-base-content').trim()

        if (baseContentColor) {
            setLabelColor(baseContentColor)
        }
    }, [themeMode])

    const needsDateConversion = (chartType === 'bar' || chartType === 'column') && xaxisType === 'datetime';
    // ApexCharts uses these internal type names; a few of our selectable
    // values map onto them.
    const apexChartType = (
        chartType === 'column' ? 'bar'
        : chartType === 'donut' ? 'donut'
        : chartType === 'pie' ? 'pie'
        : chartType === 'treemap' ? 'treemap'
        : chartType === 'heatmap' ? 'heatmap'
        : chartType === 'boxPlot' ? 'boxPlot'
        : chartType === 'candlestick' ? 'candlestick'
        : chartType === 'rangeBar' ? 'rangeBar'
        : chartType === 'rangeArea' ? 'rangeArea'
        : chartType
    );
    const isCategoricalAggregate = chartType === 'pie' || chartType === 'donut' || chartType === 'treemap';
    const isHeatmap = chartType === 'heatmap';
    // Types requiring specially-shaped data that our flat {x, y} series
    // cannot produce. Detected at render time so they fail soft.
    const shapeSpecificTypes = ['boxPlot', 'candlestick', 'rangeBar', 'rangeArea'];
    const firstPoint = series?.[0]?.data?.[0];
    const hasArrayY = firstPoint && Array.isArray(firstPoint.y);
    const shapeMismatch = shapeSpecificTypes.includes(chartType) && !hasArrayY;

    const detectGranularity = (xs) => {
        const dates = (xs || []).map(v => new Date(v)).filter(d => !isNaN(d));
        if (!dates.length) return 'day';
        const allYearStart = dates.every(d => d.getUTCMonth() === 0 && d.getUTCDate() === 1 && d.getUTCHours() === 0 && d.getUTCMinutes() === 0);
        if (allYearStart) return 'year';
        const allMonthStart = dates.every(d => d.getUTCDate() === 1 && d.getUTCHours() === 0 && d.getUTCMinutes() === 0);
        if (allMonthStart) return 'month';
        return 'day';
    }

    const dateGranularity = (xaxisType === 'datetime')
        ? detectGranularity((series || []).flatMap(s => (s.data || []).map(d => d.x)))
        : 'day';

    const formatDate = (value) => {
        const d = new Date(value);
        if (isNaN(d)) return value;
        if (dateGranularity === 'year') return String(d.getUTCFullYear());
        if (dateGranularity === 'month') {
            return d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        }
        return d.toLocaleDateString('pt-PT', { timeZone: 'UTC' });
    }

    const formatValue = (value) => {
        if (needsDateConversion) {
            return value;
        }
        if (xaxisType === 'datetime') {
            return formatDate(value);
        } else if (typeof value === 'number') {
            return value.toFixed(2)
        } else {
            return value
        }
    }

    const formatYValue = (value) => {
        if (typeof value !== 'number' || !isFinite(value)) return value;
        const abs = Math.abs(value);
        const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
        return value.toLocaleString('pt-PT', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
    }

    useEffect(() => {
        if (shapeMismatch) {
            // Clear any previous chart render and show a placeholder instead
            // of a broken Apex error. Not every wrapper produces OHLC / range /
            // box-plot shaped data, so this keeps the UI useful.
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
            if (chartContainerRef.current) {
                chartContainerRef.current.innerHTML = `
                    <div class="flex items-center justify-center w-full h-full text-xs text-base-content/60 text-center px-4">
                        This chart type requires multi-valued data and can't be drawn from the current series.
                    </div>
                `;
            }
            return;
        }

        const shape = series.map(s => s.shape)
        const _series = series.filter(s => !s.hidden)

        // Resolve CSS custom properties and modern color functions (oklch, etc.) to
        // plain rgb(...) so the chart exports cleanly to PNG.
        const resolveColor = (input) => {
            if (!input) return input;
            try {
                const probe = document.createElement('div');
                probe.style.color = 'transparent';
                probe.style.color = input;
                if (!probe.style.color || probe.style.color === 'transparent') return input;
                document.body.appendChild(probe);
                const resolved = getComputedStyle(probe).color;
                document.body.removeChild(probe);
                return resolved || input;
            } catch (_) {
                return input;
            }
        };

        const brandColors = [
            'var(--color-primary)',
            'var(--color-primary-hover)',
            'var(--color-secondary)',
            'var(--color-accent)',
            'var(--color-info)',
            'oklch(76% 0.177 163.223)',
            'oklch(82% 0.18659 84.429)',
            'oklch(71% 0.194 13.428)'
        ].map(resolveColor)

        let xaxisMin = undefined;
        let xaxisMax = undefined;

        if (xaxisRange?.min != null && xaxisRange?.max != null && !needsDateConversion) {
            xaxisMin = xaxisRange.min;
            xaxisMax = xaxisRange.max;
        }

        // Build the series / labels payload for this chart type.
        let apexSeries;
        let apexLabels;
        if (isCategoricalAggregate) {
            // Aggregate per series: sum of y-values per series, labeled by series name.
            apexLabels = _series.map((s, i) => s.name || `Series ${i + 1}`);
            apexSeries = _series.map(s =>
                (s.data || []).reduce((acc, d) => acc + (parseFloat(d.y) || 0), 0)
            );
        } else if (isHeatmap) {
            apexSeries = _series.map(s => ({
                name: s.name,
                data: (s.data || []).map(d => ({ x: d.x, y: parseFloat(d.y) || 0 })),
            }));
        } else {
            apexSeries = _series.map(s => {
                const sortedData = xaxisType === 'datetime'
                    ? [...s.data].sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())
                    : xaxisType === 'numeric'
                        ? [...s.data].sort((a, b) => a.x - b.x)
                        : [...s.data];
                if (needsDateConversion) {
                    return {
                        ...s,
                        data: sortedData.map(d => ({
                            x: formatDate(d.x),
                            y: d.y
                        }))
                    };
                }
                return { ...s, data: sortedData };
            });
        }

        const chartOptions = {
            colors: brandColors,
            chart: {
                type: apexChartType,
                id: chartId,
                group: group,
                background: 'transparent',
                animations: {
                    enabled: !disableAnimations,
                    easing: 'easeinout',
                    speed: disableAnimations ? 0 : 500,
                    animateGradually: {
                        enabled: !disableAnimations,
                        delay: disableAnimations ? 0 : 100
                    },
                    dynamicAnimation: {
                        enabled: !disableAnimations,
                        speed: disableAnimations ? 0 : 150
                    }
                },
                height: height,
                redrawOnParentResize: true,
                zoom: {
                    type: 'x',
                    enabled: allowUserInteraction,
                    autoScaleYaxis: allowUserInteraction
                },
                pan: {
                    enabled: allowUserInteraction,
                    type: 'x',
                    rangeX: undefined
                },
                selection: {
                    enabled: allowUserInteraction,
                    type: 'x'
                },
                toolbar: {
                    show: showToolbar,
                    tools: {
                        // Must be truthy so ApexCharts builds the download menu DOM —
                        // chart.dataURI() reads .style on it internally. The toolbar
                        // is hidden offscreen via CSS, so this is invisible to users.
                        download: true,
                        selection: allowUserInteraction && !needsDateConversion,
                        zoom: allowUserInteraction && !needsDateConversion,
                        zoomin: allowUserInteraction,
                        zoomout: allowUserInteraction,
                        pan: allowUserInteraction && !needsDateConversion,
                        reset: allowUserInteraction
                    },
                    autoSelected: allowUserInteraction && !needsDateConversion ? activeTool : undefined
                },
                events: {
                    beforeMount: function (chart) {
                        if (document.getElementById('roots-apexcharts-theme')) return;
                        const style = document.createElement('style');
                        style.id = 'roots-apexcharts-theme';
                        style.innerHTML = `
                            .apexcharts-toolbar {
                                position: absolute !important;
                                left: -10000px !important;
                                top: -10000px !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }
                        `;
                        document.head.appendChild(style);
                    },
                    mounted: function(chart) {
                        console.log('Chart mounted, pan enabled:', chart.opts.chart.pan);
                    },
                    zoomed: function(chartContext, { xaxis, yaxis }) {
                        if (onViewportChangeRef.current && xaxis) {
                            onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                    },
                    updated: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current && xaxis) {
                            onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                    },
                    scrolled: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current && xaxis) {
                            onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                    },
                    selection: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current && xaxis && xaxis.min != null && xaxis.max != null && xaxis.min < xaxis.max) {
                            onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                    }
                }
            },
            plotOptions: {
                bar: {
                    horizontal: chartType === 'bar'
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 2,
                curve: 'smooth'
            },
            fill: {
                opacity: 0.8
            },
            grid: {
                borderColor: 'var(--color-base-300)',
                strokeDashArray: 0,
                padding: compact ? {
                    top: -20,
                    right: 0,
                    bottom: 0,
                    left: 0
                } : {
                    top: 0,
                    right: 10,
                    bottom: 20,
                    left: 10
                },
                xaxis: {
                    lines: {
                        show: true
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            series: apexSeries,
            ...(apexLabels ? { labels: apexLabels } : {}),
            title: {
                text: '',
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: labelColor
                }
            },
            xaxis: {
                type: chartType === 'bar' || chartType === 'column' ? 'category' : xaxisType,
                min: xaxisMin,
                max: xaxisMax,
                labels: {
                    show: !minimalAxis,
                    style: {
                        colors: '#737373',
                        fontSize: compact ? '11px' : '12px',
                        fontFamily: 'Onest, sans-serif'
                    },
                    formatter: formatValue
                },
                axisBorder: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                axisTicks: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                forceNiceScale: true,
                min: log ? undefined : (() => {
                    const ys = (_series || []).flatMap(s => (s.data || []).map(d => parseFloat(d.y))).filter(v => isFinite(v));
                    if (!ys.length) return undefined;
                    return Math.min(...ys) >= 0 ? 0 : undefined;
                })(),
                max: log ? undefined : (() => {
                    const ys = (_series || []).flatMap(s => (s.data || []).map(d => parseFloat(d.y))).filter(v => isFinite(v));
                    if (!ys.length) return undefined;
                    const dataMax = Math.max(...ys);
                    if (dataMax <= 0) return undefined;
                    const padded = dataMax * 1.1;
                    const mag = Math.pow(10, Math.floor(Math.log10(padded)));
                    const normalized = padded / mag;
                    const niceSteps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
                    const niceStep = niceSteps.find(s => s >= normalized) || 10;
                    return niceStep * mag;
                })(),
                labels: {
                    show: !minimalAxis,
                    style: {
                        colors: '#000000',
                        fontSize: compact ? '8px' : '12px',
                        fontFamily: 'Onest, sans-serif'
                    },
                    offsetX: compact ? -8 : 0,
                    formatter: formatYValue
                },
                axisBorder: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                axisTicks: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                logarithmic: !!log,
                logBase: log || 10
            },
            annotations: {
                xaxis: annotations.xaxis.map(annotation => ({
                    x: annotation.value,
                    strokeDashArray: 8,
                    borderColor: 'var(--color-base-content)',
                    opacity: 0.1,
                    label: {
                        text: annotation.label,
                    }
                })),
                yaxis: annotations.yaxis.map(annotation => ({
                    y: annotation.value,
                    borderColor: 'var(--color-primary)',
                    label: {
                        borderColor: "var(--color-primary)",
                        text: annotation.label,
                        style: {
                            color: 'var(--color-primary-content)',
                            background: 'var(--color-primary)'
                        }
                    },
                }))
            },
            markers: (shape || []).some(s => s) ? { shape } : {},
            legend: {
                show: showLegend,
                showForSingleSeries: showLegend,
                labels: {
                    colors: labelColor
                },
                markers: {
                    offsetX: -3,
                    size: 5,
                    strokeWidth: 0
                },
                itemMargin: {
                    horizontal: 15
                }
            },
            tooltip: {
                theme: themeMode,
                enabled: showTooltip,
                custom: showTooltip ? ({
                    series,
                    seriesIndex,
                    dataPointIndex,
                    w
                }) => {
                    // Pie / donut / treemap: one value per "series" (slice).
                    if (isCategoricalAggregate) {
                        const label = w?.config?.labels?.[seriesIndex] ?? `Série ${seriesIndex + 1}`;
                        const value = Array.isArray(series) ? series[seriesIndex] : undefined;
                        return `<div class="bg-base-100">
                            <div class="bg-base-200 p-2 font-bold text-base-content">${label}</div>
                            <div class="p-2"><span>${value ?? ''}</span></div>
                        </div>`;
                    }
                    // Heatmap: x value is the column, y is the cell value.
                    if (isHeatmap) {
                        const point = _series?.[seriesIndex]?.data?.[dataPointIndex];
                        const name = _series?.[seriesIndex]?.name || `Série ${seriesIndex + 1}`;
                        const xLabel = point ? formatValue(point.x) : '';
                        const yValue = point ? point.y : '';
                        return `<div class="bg-base-100">
                            <div class="bg-base-200 p-2 font-bold text-base-content">${xLabel}</div>
                            <div class="p-2"><span class="font-semibold">${name}:</span> <span>${yValue}</span></div>
                        </div>`;
                    }
                    // Default {x, y} charts.
                    const point = _series?.[seriesIndex]?.data?.[dataPointIndex];
                    if (!point) return '';
                    const header = `<div class="bg-base-200 p-2 font-bold text-base-content">
                        ${formatValue(point.x)}
                    </div>`;
                    const body = w.config.series.map((s, index) => {
                        const name = (s && typeof s === 'object') ? s.name : null;
                        const value = Array.isArray(series[index]) ? series[index][dataPointIndex] : series[index];
                        return `<div class="p-2">
                            <span class="font-semibold">${name || `Série ${index + 1}`}:</span>
                            <span>${value}</span>
                        </div>`;
                    }).join('');
                    return `<div class="bg-base-100">
                        ${header}
                        ${body}
                    </div>`;
                } : undefined
            }
        }

        if (chartRef.current) {
            try { chartRef.current.destroy() } catch (_) { /* swallow */ }
        }

        try {
            const chart = new ApexCharts(chartContainerRef.current, chartOptions)
            // render() returns a promise; catch rejections so a chart-specific
            // failure (bad data shape for the chosen type) doesn't become an
            // unhandled promise rejection that tanks the page.
            chart.render().catch((err) => {
                console.error('ApexCharts render failed:', err, { chartType, chartId, seriesPreview: Array.isArray(apexSeries) ? apexSeries.slice(0, 2) : apexSeries });
                if (chartContainerRef.current) {
                    chartContainerRef.current.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full text-xs text-base-content/60 text-center px-4">
                            Could not render this chart type with the current data.
                        </div>
                    `;
                }
            });
            chartRef.current = chart
        } catch (err) {
            console.error('ApexCharts construction failed:', err, { chartType, chartId });
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy()
            }
        }
    }, [title, chartId, chartType, xaxisType, annotations, log, series, group, height, themeMode, labelColor, showLegend, showToolbar, showTooltip, allowUserInteraction, minimalAxis, activeTool, xaxisRange])

    return <div ref={chartContainerRef} className="w-full h-full" />
})

GChart.propTypes = {
    title: PropTypes.string,
    chartId: PropTypes.string.isRequired,
    chartType: PropTypes.oneOf([
        'line', 'area', 'bar', 'column', 'scatter',
        'pie', 'donut', 'treemap', 'heatmap',
        'boxPlot', 'candlestick', 'rangeBar', 'rangeArea',
    ]).isRequired,
    xaxisType: PropTypes.oneOf(['datetime', 'category', 'numeric']).isRequired,
    annotations: PropTypes.shape({
        xaxis: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            label: PropTypes.string
        })),
        yaxis: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.number,
            label: PropTypes.string
        }))
    }),
    log: PropTypes.number,
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        hidden: PropTypes.bool,
        data: PropTypes.arrayOf(PropTypes.shape({
            x: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            y: PropTypes.number
        }))
    })).isRequired,
    group: PropTypes.string,
    height: PropTypes.number,
    themeMode: PropTypes.oneOf(['light', 'dark']),
    showLegend: PropTypes.bool,
    showToolbar: PropTypes.bool,
    showTooltip: PropTypes.bool,
    allowUserInteraction: PropTypes.bool,
    compact: PropTypes.bool,
    minimalAxis: PropTypes.bool,
    activeTool: PropTypes.oneOf(['zoom', 'pan', 'selection']),
    disableAnimations: PropTypes.bool,
    onViewportChange: PropTypes.func,
    xaxisRange: PropTypes.shape({
        min: PropTypes.number,
        max: PropTypes.number
    })
}

GChart.defaultProps = {
    annotations: { xaxis: [], yaxis: [] },
    themeMode: 'light',
    showLegend: true,
    showToolbar: true,
    showTooltip: true,
    allowUserInteraction: true,
    compact: false,
    disableAnimations: false
}

export default GChart