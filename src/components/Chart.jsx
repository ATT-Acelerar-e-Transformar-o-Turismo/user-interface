import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import ApexCharts from 'apexcharts'

const DEFAULT_ANNOTATIONS = { xaxis: [], yaxis: [] }

const GChart = forwardRef(({ title, chartId, chartType, xaxisType, annotations = DEFAULT_ANNOTATIONS, log, series, group, height, themeMode = 'light', showLegend = true, showToolbar = true, showTooltip = true, allowUserInteraction = true, compact = false, disableAnimations = false, onViewportChange }, ref) => {
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
        // Obtém os estilos computados do elemento raiz
        const computedStyle = getComputedStyle(document.documentElement)
        const baseContentColor = computedStyle.getPropertyValue('--color-base-content').trim()

        if (baseContentColor) {
            setLabelColor(baseContentColor)
        }
    }, [themeMode])

    const formatValue = (value) => {
        if (xaxisType === 'datetime') {
            return new Date(value).toLocaleDateString('pt-PT')
        } else if (typeof value === 'number') {
            return value.toFixed(2)
        } else {
            return value
        }
    }

    useEffect(() => {

        const shape = series.map(s => s.shape)

        const _series = series.filter(s => !s.hidden)

        const brandColors = [
            'var(--color-primary)', // Primary green
            'var(--color-primary-hover)', // Primary hover green
            'var(--color-secondary)', // Secondary
            'var(--color-accent)', // Accent
            'var(--color-info)', // Info
            'oklch(76% 0.177 163.223)', // Success
            'oklch(82% 0.18659 84.429)', // Warning
            'oklch(71% 0.194 13.428)' // Error
        ]

        // Calculate default zoom range (last 20%) for datetime charts
        let xaxisMin = undefined;
        let xaxisMax = undefined;

        if (xaxisType === 'datetime' && _series.length > 0 && _series[0].data.length > 0) {
            const allData = _series.flatMap(s => s.data);
            const dataMin = Math.min(...allData.map(d => d.x));
            const dataMax = Math.max(...allData.map(d => d.x));
            
            // Show last 50% of the data range
            xaxisMin = dataMax - (dataMax - dataMin) * 0.5;
            xaxisMax = dataMax;
        }

        const chartOptions = {
            colors: brandColors,
            chart: {
                type: chartType === 'column' ? 'bar' : chartType,
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
                    rangeX: undefined // Allow unlimited panning
                },
                selection: {
                    enabled: allowUserInteraction,
                    type: 'x'
                },
                toolbar: {
                    show: showToolbar,
                    tools: {
                        download: false,
                        selection: allowUserInteraction,
                        zoom: allowUserInteraction,
                        zoomin: allowUserInteraction,
                        zoomout: allowUserInteraction,
                        pan: allowUserInteraction,
                        reset: allowUserInteraction
                    },
                    autoSelected: allowUserInteraction ? 'pan' : undefined,
                    export: {
                        csv: {
                            headerCategory: 'x',
                            dateFormatter: formatValue
                        }
                    }
                },
                events: {
                    beforeMount: function (chart) {
                        console.log('Chart mounting with scroll functionality');
                        // Add custom CSS to style the toolbar and menu
                        const style = document.createElement('style')
                        style.innerHTML = `
                            .apexcharts-toolbar {
                                background: var(--color-base-200) !important;
                            }
                            .apexcharts-menu {
                                background: var(--color-base-200) !important;
                                border: 2px solid var(--color-base-300) !important;
                            }
                            .apexcharts-menu-item:hover {
                                background: var(--color-base-300) !important;
                            }
                        `
                        document.head.appendChild(style)
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
            // sort series
            series: xaxisType == 'category' ? _series : _series.map(s => ({
                ...s,
                data: s.data.sort((a, b) => a.x - b.x)
            })),
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
                    style: {
                        colors: '#000000',
                        fontSize: compact ? '8px' : '12px',
                        fontFamily: 'Onest, sans-serif'
                    },
                    formatter: formatValue
                },
                axisBorder: {
                    show: !compact,
                    color: '#000000'
                },
                axisTicks: {
                    show: !compact,
                    color: '#000000'
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#000000',
                        fontSize: compact ? '8px' : '12px',
                        fontFamily: 'Onest, sans-serif'
                    },
                    offsetX: compact ? -15 : 0 // Shift labels left in compact mode
                },
                axisBorder: {
                    show: !compact,
                    color: '#000000'
                },
                axisTicks: {
                    show: !compact,
                    color: '#000000'
                },
                logarithmic: log == null ? false : true,
                logBase: log == null ? 10 : log
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
            markers: {
                shape: shape
            },
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
                    const header = `<div class="bg-base-200 p-2 font-bold text-base-content">
                        ${formatValue(_series[seriesIndex].data[dataPointIndex].x)}
                    </div>`

                    const body = w.config.series.map((s, index) => {
                        return `<div class="p-2">
                            <span class="font-semibold">${s.name || `Série ${index + 1}`}:</span>
                            <span>${series[index][dataPointIndex]}</span>
                        </div>`
                    }).join('')

                    return `<div class="bg-base-100">
                        ${header}
                        ${body}
                    </div>`
                } : undefined
            }
        }

        // Destruir o gráfico anterior se existir
        if (chartRef.current) {
            chartRef.current.destroy()
        }

        // Criar e renderizar o novo gráfico
        const chart = new ApexCharts(chartContainerRef.current, chartOptions)
        chart.render()

        // Guardar a referência do gráfico
        chartRef.current = chart

        // Cleanup quando o componente for desmontado
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy()
            }
        }
    }, [title, chartId, chartType, xaxisType, annotations, log, series, group, height, themeMode, labelColor, showLegend, showToolbar, showTooltip, allowUserInteraction])

    return <div ref={chartContainerRef} className="w-full h-full" />
})

GChart.propTypes = {
    title: PropTypes.string,
    chartId: PropTypes.string.isRequired,
    chartType: PropTypes.oneOf(['line', 'area', 'bar', 'column', 'scatter']).isRequired,
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
    disableAnimations: PropTypes.bool,
    onViewportChange: PropTypes.func
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