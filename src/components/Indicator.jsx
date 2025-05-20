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

// Utility functions
const updateSerieVisibility = (serie, chartId, activeFilters) => {
  if (!activeFilters[chartId]) return { ...serie, hidden: true };

  const isVisible = activeFilters[chartId].every(filter => {
    const filterValue = serie.filterValues?.find(f => f.label === filter.label)?.value;
    return filter.values.includes(filterValue);
  });

  return { ...serie, hidden: !isVisible };
};

const updateChartSeries = (chart, activeFilters) => {
  const updatedSeries = chart.series.map(serie =>
    updateSerieVisibility(serie, chart.chartId, activeFilters)
  );

  return { ...chart, series: updatedSeries };
};

const createChartWithId = (chart, index) => ({
  ...chart,
  chartId: `chart${index + 1}`
});

const createMobileChart = (chart) => ({
  ...chart,
  chartId: `${chart.chartId}_mobile`
});

const getInitialFilters = (charts) => {
  return charts.reduce((acc, chart) => {
    acc[chart.chartId] = chart.activeFilters;
    return acc;
  }, {});
};

const Indicator = ({ charts }) => {
  const { width } = useWindowSize();
  const [chartData, setChartData] = useState([]);
  const [chartDataMobile, setChartDataMobile] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeView, setActiveView] = useState({});

  useEffect(() => {
    const chartsWithIds = charts.map(createChartWithId);
    setChartData(chartsWithIds);

    const initialFilters = getInitialFilters(chartsWithIds);
    setActiveFilters(initialFilters);

    setActiveView(chartsWithIds.map(() => 'line'));
  }, [charts]);

  useEffect(() => {
    const mobileCharts = chartData.map(createMobileChart);
    setChartDataMobile(mobileCharts);
  }, [chartData]);

  useEffect(() => {
    const updatedCharts = chartData.map(chart =>
      updateChartSeries(chart, activeFilters)
    );
    setChartData(updatedCharts);
  }, [activeFilters]);

  const handleFilterChange = (chartId, filterGroup, values) => {
    setActiveFilters(prev => {
      const updatedFilters = prev[chartId].map(filter =>
        filter.label === filterGroup ? { ...filter, values } : filter
      );
      return { ...prev, [chartId]: updatedFilters };
    });
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

  const renderSingleChart = () => (
    <>
      <h2 className='text-2xl font-bold'>{chartData[0].title}</h2>
      <p className='text-sm text-neutral'>{chartData[0].period}</p>
      <div className='hidden md:block'>
        <label className="sr-only">Example range</label>
        <div className='flex flex-row'>
          <Filter
            filters={chartData[0].availableFilters}
            activeFilters={activeFilters.chart1}
            onFilterChange={(filterGroup, values) =>
              handleFilterChange('chart1', filterGroup, values)
            }
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
  );

  const renderChartGrid = () => (
    <div className='hidden md:grid gap-4 grid-cols-2'>
      {chartData.map((data, index) => (
        <div className='' key={data.chartId}>
          <h2 className='text-2xl font-bold'>{data.title}</h2>
          <p className='text-sm text-neutral'>{data.period}</p>
          <div className='flex flex-row'>
            <Filter
              filters={data.availableFilters}
              activeFilters={activeFilters[data.chartId]}
              onFilterChange={(filterGroup, values) =>
                handleFilterChange(data.chartId, filterGroup, values)
              }
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

  const renderMobileCharts = () => (
    chartDataMobile.map((data, index) => (
      <div className='md:hidden w-full' key={data.chartId}>
        <h2 className='text-2xl font-bold'>{data.title}</h2>
        <p className='text-sm text-neutral'>{data.period}</p>
        <div className='flex flex-row'>
          <Filter
            filters={data.availableFilters}
            activeFilters={activeFilters[data.chartId.split('_')[0]]}
            onFilterChange={(filterGroup, values) =>
              handleFilterChange(data.chartId.split('_')[0], filterGroup, values)
            }
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
    ))
  );

  return (
    <div className='mx-2'>
      {/* Desktop */}
      {chartData.length === 1 ? renderSingleChart() : renderChartGrid()}
      {/* Mobile */}
      {renderMobileCharts()}
    </div>
  );
};

export default Indicator;