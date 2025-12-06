import React, { useEffect, useState } from 'react'
import GChart from './Chart'
import Views from './Views'
import Filter from './Filter'
import { useWindowSize } from '../hooks/useWindowSize'

const chartDataSample = {
  chartType: 'line',
  xaxisType: 'datetime', // 'datetime', 'category' or 'numeric'
  group: 'sales',
  annotations: {
    xaxis: [{
      x: new Date('03/01/2020').getTime(),
      borderColor: 'var(--color-primary)',
      label: {
        text: 'test'
      }
    }]
  },
  series: [
    {
      name: 'B2B Sales',
      hidden: false,
      data: [{
        x: '2020-01-01',
        y: 30,
      },
      {
        x: '2020-02-01',
        y: 40,
      },
      {
        x: '2020-03-01',
        y: 35,
      },
      {
        x: '2020-04-01',
        y: 50,
      },
      {
        x: '2020-05-01',
        y: 49,
      },
      {
        x: '2020-06-01',
        y: 60,
      }]
    },
    {
      name: 'B2C Sales',
      hidden: false,
      data: [{
        x: '2020-01-01',
        y: 20,
      },
      {
        x: '2020-02-01',
        y: 25,
      },
      {
        x: '2020-03-01',
        y: 45,
      },
      {
        x: '2020-04-01',
        y: 40,
      },
      {
        x: '2020-05-01',
        y: 39,
      },
      {
        x: '2020-06-01',
        y: 50,
      }]
    }
  ]
}

const chartDataSample2 = {
  chartType: 'line',
  xaxisType: 'datetime', // 'datetime', 'category' or 'numeric'
  group: 'sales',
  // title: 'Sales',
  // period: 'Annual',
  // log: 10, // null for linear, x for log base x
  series: [
    {
      name: 'B2B Sales',
      hidden: false,
      data: [{
        x: '2020-01-01',
        y: 30,
      },
      {
        x: '2020-02-01',
        y: 40,
      },
      {
        x: '2020-03-01',
        y: 35,
      },
      {
        x: '2020-04-01',
        y: 50,
      },
      {
        x: '2020-05-01',
        y: 49,
      },
      {
        x: '2020-06-01',
        y: 60,
      }]
    }
  ]
};

const Indicator = ({ charts }) => {
  const { width } = useWindowSize();
  const [chartData, setChartData] = useState([]);
  const [chartDataMobile, setChartDataMobile] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeView, setActiveView] = useState([]);

  useEffect(() => {
    setChartDataMobile(chartData.map(chart => ({
      ...chart,
      chartId: `${chart.chartId}_mobile`,
    })));
  }, [chartData]);

  useEffect(() => {
    const chartsWithIds = charts.map((chart, index) => ({
      ...chart,
      chartId: `chart${index + 1}`
    }));
    setChartData(chartsWithIds);

    const initialFilters = chartsWithIds.reduce((acc, chart) => {
      acc[chart.chartId] = chart.activeFilters;
      return acc;
    }, {});
    setActiveFilters(initialFilters);

    setActiveView(chartsWithIds.map(() => 'line'));
  }, [charts]);

  useEffect(() => {
    setChartData(prev => prev.map(chart => ({
      ...chart,
      series: chart.series.map(serie => ({
        ...serie,
        hidden: !(
          activeFilters[chart.chartId] &&
          activeFilters[chart.chartId].every(
            filter => filter.values.includes(
              serie.filterValues.find(f => f.label === filter.label)?.value
            )
          )
        )
      }))
    })));
  }, [activeFilters]);

  const handleFilterChange = (chartId, filterGroup, values) => {
    setActiveFilters(prev => ({
      ...prev,
      [chartId]: prev[chartId].map(filter =>
        filter.label === filterGroup ? { ...filter, values } : filter
      )
    }));
  };

  const handleViewChange = (newView, index) => {
    setActiveView(prev => ({
      ...prev,
      [index]: newView
    }));
    setChartData(prev => prev.map((chart, i) => ({
      ...chart,
      chartType: i === index ? newView : chart.chartType
    })));
  };

  return (
    <div className='w-full h-full'>
      {/* Desktop */}
      {chartData.length === 1 && (
        <>
          <div className='hidden md:block h-full'>
            <div className='flex flex-col h-full'>
              {/* Minimal chart header with just filters */}
              <div className='flex items-center mb-4'>
                <Filter
                  filters={chartData[0].availableFilters}
                  activeFilters={activeFilters.chart1}
                  onFilterChange={(filterGroup, values) => handleFilterChange('chart1', filterGroup, values)}
                />
              </div>

              {/* Chart takes remaining space with cleaner styling */}
              <div className='flex-1 min-h-0'>
                <GChart
                  key={chartData[0].chartId}
                  {...chartData[0]}
                  height='100%'
                  options={{
                    ...chartData[0].options,
                    toolbar: {
                      show: false  // Hide the toolbar for cleaner look
                    },
                    chart: {
                      ...chartData[0].options?.chart,
                      toolbar: {
                        show: false
                      }
                    },
                    stroke: {
                      curve: 'smooth',
                      width: 2
                    },
                    markers: {
                      size: 0,  // Hide individual point markers for cleaner line
                      strokeWidth: 0,
                      hover: {
                        size: 4
                      }
                    },
                    grid: {
                      borderColor: 'var(--color-base-300)',
                      strokeDashArray: 0
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      ) || (
        <div className={`hidden md:grid gap-4 grid-cols-2 h-full`}>
          {chartData.map((data, index) => (
            <div className='flex flex-col h-full' key={data.chartId}>
              <h2 className='text-xl font-bold'>{data.title}</h2>
              <p className='text-xs text-neutral mb-4'>{data.period}</p>
              <div className='flex items-center justify-between mb-4'>
                <Filter
                  filters={data.availableFilters}
                  activeFilters={activeFilters[data.chartId]}
                  onFilterChange={(filterGroup, values) => handleFilterChange(data.chartId, filterGroup, values)}
                />
                <div className='flex items-center gap-2'>
                  <Views
                    size={width > 640 ? 'sm' : 'xs'}
                    activeView={activeView[index]}
                    onViewChange={(view) => handleViewChange(view, index)}
                  />
                </div>
              </div>
              <div className='flex-1 min-h-0'>
                <GChart key={data.chartId} {...data} height='100%' />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Mobile */}
      {chartDataMobile.map((data, index) => (
        <div className='md:hidden w-full' key={data.chartId}>
          <div className='flex flex-row items-center justify-between mb-4'>
            <Filter
              filters={data.availableFilters}
              activeFilters={activeFilters[data.chartId.split('_')[0]]}
              onFilterChange={(filterGroup, values) => handleFilterChange(data.chartId.split('_')[0], filterGroup, values)}
            />
            <div className='flex items-center gap-2'>
              <Views
                size={width > 640 ? 'sm' : 'xs'}
                activeView={activeView[index]}
                onViewChange={(view) => handleViewChange(view, index)}
              />
            </div>
          </div>
          <GChart key={data.chartId} {...data} height={350} />
        </div>
      ))}
    </div>
  );
};

export default Indicator;