import React, { useEffect, useState, useRef } from 'react'
import ApexCharts from 'apexcharts'

const GChart = ({ title, chartType, xaxisType, log, horizontal, series, height, themeMode = 'light' }) => {
    const [labelColor, setLabelColor] = useState(themeMode === 'dark' ? '#ffffff' : '#000000')
    const [options, setOptions] = useState({})
    const chartRef = useRef(null)

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

        const _series = series

        const chartOptions = {
            chart: {
                type: chartType,
                id: title,
                background: 'transparent',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 500,
                    animateGradually: {
                        enabled: true,
                        delay: 100
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 150
                    }
                },
                height: height,
                redrawOnParentResize: true,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    },
                    autoSelected: 'zoom',
                    export: {
                        csv: {
                            headerCategory: 'Data',
                            dateFormatter: formatValue
                        }
                    }
                },
                events: {
                    beforeMount: function (chart) {
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
                    }
                }
            },
            plotOptions: {
                bar: {
                    horizontal: horizontal
                }
            },
            // sort series
            series: xaxisType == 'category' ? _series : _series.map(s => ({
                ...s,
                data: s.data.sort((a, b) => a.x - b.x)
            })),
            title: {
                text: title,
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: labelColor
                }
            },
            xaxis: {
                type: xaxisType,
                labels: {
                    style: {
                        colors: labelColor
                    },
                    formatter: formatValue
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: labelColor
                    }
                },
                logarithmic: log == null ? false : true,
                logBase: log == null ? 10 : log
            },
            markers: {
                shape: shape
            },
            legend: {
                show: true,
                showForSingleSeries: true,
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
                custom: ({
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
                }
            }
        }

        if (chartRef.current) {
            chartRef.current.destroy()
        }

        const chart = new ApexCharts(chartContainerRef.current, chartOptions)
        chart.render()

        chartRef.current = chart

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy()
            }
        }
    }, [title, chartType, xaxisType, log, horizontal, series, height, themeMode, labelColor])

    return <div id="chart" />
}

export default GChart