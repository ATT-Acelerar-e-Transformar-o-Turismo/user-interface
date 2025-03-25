import React, { useEffect, useState } from 'react'
import GChart from './chart'
import Views from './views'
import Filter from './filter'
import { useWindowSize } from '../hooks/useWindowSize'

const chartDataSample = {
  chartType: 'line',
  xaxisType: 'datetime', // 'datetime', 'category' or 'numeric'
  group: 'sales',
  annotations: {
    xaxis: [{
      x: new Date('03/01/2020').getTime(),
      borderColor: '#775DD0',
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
    <div className='mx-2'>
      {/* Desktop */}
      {chartData.length === 1 && (
        <>
          <h2 className='text-2xl font-bold'>{chartData[0].title}</h2>
          <p className='text-sm text-neutral'>{chartData[0].period}</p>
          <div className='hidden md:block'>
            <label className="sr-only">Example range</label>
            <div className='flex flex-row'>
              <Filter
                filters={chartData[0].availableFilters}
                activeFilters={activeFilters.chart1}
                onFilterChange={(filterGroup, values) => handleFilterChange('chart1', filterGroup, values)}
              />
              <div className='flex-grow'>
                <GChart key={chartData[0].chartId} {...chartData[0]} height={500} />
              </div>
              <div className='flex flex-col gap-2'>
                <Views
                  size={width > 640 ? 'sm' : 'xs'}
                  activeView={activeView[0]}
                  onViewChange={(view) => handleViewChange(view, 0)}
                />
              </div>
            </div>
          </div>
        </>
      ) || (
        <div className={`hidden md:grid gap-4 grid-cols-2`}>
          {chartData.map((data, index) => (
            <div className='' key={data.chartId}>
              <h2 className='text-2xl font-bold'>{data.title}</h2>
              <p className='text-sm text-neutral'>{data.period}</p>
              <div className='flex flex-row'>
                <Filter
                  filters={data.availableFilters}
                  activeFilters={activeFilters[data.chartId]}
                  onFilterChange={(filterGroup, values) => handleFilterChange(data.chartId, filterGroup, values)}
                />
                <div className='flex-grow'></div>
                <div className='flex flex-row gap-2 mt-6 mb-4'>
                  <Views
                    size={width > 640 ? 'sm' : 'xs'}
                    activeView={activeView[index]}
                    onViewChange={(view) => handleViewChange(view, index)}
                  />
                </div>
              </div>
              <GChart key={data.chartId} {...data} height={500} />
            </div>
          ))}
        </div>
      )}
      {/* Mobile */}
      {chartDataMobile.map((data, index) => (
        <div className='md:hidden w-full' key={data.chartId}>
          <h2 className='text-2xl font-bold'>{data.title}</h2>
          <p className='text-sm text-neutral'>{data.period}</p>
          <div className='flex flex-row'>
            <Filter
              filters={data.availableFilters}
              activeFilters={activeFilters[data.chartId.split('_')[0]]}
              onFilterChange={(filterGroup, values) => handleFilterChange(data.chartId.split('_')[0], filterGroup, values)}
            />
            <div className='flex-grow'></div>
            <div className='flex flex-row gap-2 mt-6 mb-4'>
              <Views
                size={width > 640 ? 'sm' : 'xs'}
                activeView={activeView[index]}
                onViewChange={(view) => handleViewChange(view, index)}
              />
            </div>
          </div>
          <GChart key={data.chartId} {...data} height={500} />
        </div>
      ))}
    </div>
  );
};

export default Indicator;