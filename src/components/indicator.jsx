import React, { useEffect, useState } from 'react'
import GChart from './chart'
import Views from './views'
import Filter from './filter'
import { useWindowSize } from '../hooks/useWindowSize'

const chartDataSample = {
  chartType: 'line',
  xaxisType: 'datetime', // 'datetime', 'category' or 'numeric'
  group: 'sales',
  title: 'Sales',
  period: 'Annual',
  // log: 10, // null for linear, x for log base x
  availableFilters: {
    segment: ['B2B', 'B2C'],
  },
  series: [
    {
      name: 'B2B Sales',
      hidden: false,
      data: [{
        x: '2020-01-01',
        y: 30,
        segment: 'B2B'
      },
      {
        x: '2020-02-01',
        y: 40,
        segment: 'B2B'
      },
      {
        x: '2020-03-01',
        y: 35,
        segment: 'B2B'
      },
      {
        x: '2020-04-01',
        y: 50,
        segment: 'B2B'
      },
      {
        x: '2020-05-01',
        y: 49,
        segment: 'B2B'
      },
      {
        x: '2020-06-01',
        y: 60,
        segment: 'B2B'
      }]
    },
    {
      name: 'B2C Sales',
      hidden: false,
      data: [{
        x: '2020-01-01',
        y: 20,
        segment: 'B2C'
      },
      {
        x: '2020-02-01',
        y: 25,
        segment: 'B2C'
      },
      {
        x: '2020-03-01',
        y: 45,
        segment: 'B2C'
      },
      {
        x: '2020-04-01',
        y: 40,
        segment: 'B2C'
      },
      {
        x: '2020-05-01',
        y: 39,
        segment: 'B2C'
      },
      {
        x: '2020-06-01',
        y: 50,
        segment: 'B2C'
      }]
    }
  ]
}

const chartDataSample2 = {
  chartType: 'line',
  xaxisType: 'datetime', // 'datetime', 'category' or 'numeric'
  group: 'sales',
  title: 'Sales',
  period: 'Annual',
  // log: 10, // null for linear, x for log base x
  availableFilters: {
    segment: ['B2B'],
  },
  series: [
    {
      name: 'B2B Sales',
      hidden: false,
      data: [{
        x: '2020-01-01',
        y: 30,
        segment: 'B2B'
      },
      {
        x: '2020-02-01',
        y: 40,
        segment: 'B2B'
      },
      {
        x: '2020-03-01',
        y: 35,
        segment: 'B2B'
      },
      {
        x: '2020-04-01',
        y: 50,
        segment: 'B2B'
      },
      {
        x: '2020-05-01',
        y: 49,
        segment: 'B2B'
      },
      {
        x: '2020-06-01',
        y: 60,
        segment: 'B2B'
      }]
    }
  ]
};


const Indicator = ({ }) => {
  const { width } = useWindowSize();

  const [chartData, setChartData] = useState([]);

  const [chartDataMobile, setChartDataMobile] = useState([]);

  const [activeFilters, setActiveFilters] = useState({
    chart1: { segment: ['B2B', 'B2C'] },
    chart2: { segment: ['B2B', 'B2C'] }
  });
  const [activeView, setActiveView] = useState([]);

  useEffect(() => {
    setChartDataMobile(chartData.map(chart => ({
      ...chart,
      chartId: `${chart.chartId}_mobile`,
    })));
  }, [chartData]);

  // from sample, create chart data
  useEffect(() => {
    const charts = [
      { ...chartDataSample, chartId: 'chart1' },
      { ...chartDataSample2, chartId: 'chart2' }
    ];
    setChartData(charts);
    setActiveFilters(prev => ({
      ...prev,
      chart1: { segment: ['B2B', 'B2C'] },
      chart2: { segment: ['B2B', 'B2C'] }
    }));

    setActiveView([
      'line',
      'line'
    ]);
  }, []);

  const availableFilters = {
    segment: ['B2B', 'B2C'],
  };

  useEffect(() => {
    // Mark as hidden all series that are not in the activeFilters
    setChartData(prev => prev.map(chart => ({
      ...chart,
      series: chart.series.map(serie => ({
        ...serie,
        hidden: !activeFilters[chart.chartId].segment.includes(serie.name.split(' ')[0])
      }))
    })));
  }, [activeFilters]);

  const handleFilterChange = (chartId, filterGroup, values) => {
    setActiveFilters(prev => {
      return ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [filterGroup]: values
        }
      })
    });
  };


  const handleViewChange = (newView, index) => {
    setActiveView(prev => ({
      ...prev,
      [index]: newView
    }));
    setChartData(prev => prev.map((chart, i) => {
      return ({
        ...chart,
        chartType: i === index ? newView : chart.chartType
      })
    }));
  };

  return (
    <div className='mx-2'>
      {/* Desktop */}
      {/* If only one chart... */}
      {chartData.length === 1 && (
        <>
          <h2 className='text-2xl font-bold'>{chartData[0].title}</h2>
          <p className='text-sm text-neutral'>{chartData[0].period}</p>
          <div className='hidden md:block'>
            <label className="sr-only">Example range</label>

            <div className='flex flex-row'>
              <Filter
                filters={availableFilters}
                activeFilters={activeFilters.chart1}
                onFilterChange={(filterGroup, values) => handleFilterChange('chart1', filterGroup, values)}
              />
              <div className='flex-grow'>
                {chartData.map((data, index) => (
                  <GChart key={data.chartId} {...data} height={500} />
                ))}
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
          < div className={`hidden md:grid gap-4 grid-cols-${chartData.length}`}>
            {/** If two or more charts */}

            {chartData.map((data, index) => (
              <div className='' key={data.chartId}>
                <h2 className='text-2xl font-bold'>{data.title}</h2>
                <p className='text-sm text-neutral'>{data.period}</p>
                <div className='flex flex-row'>
                  <Filter
                    filters={data.availableFilters}
                    activeFilters={activeFilters[data.chartId]}
                    onFilterChange={(filterGroup, values) => handleFilterChange('chart1', filterGroup, values)}
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
        )
      }

      {/* Mobile */}
      {
        chartDataMobile.map((data, index) => (
          <div className='md:hidden w-full' key={data.chartId}>
            <h2 className='text-2xl font-bold'>{data.title}</h2>
            <p className='text-sm text-neutral'>{data.period}</p>
            <div className='flex flex-row'>
              <Filter
                filters={data.availableFilters}
                activeFilters={activeFilters[data.chartId.split('_')[0]]}
                onFilterChange={(filterGroup, values) => handleFilterChange('chart1', filterGroup, values)}
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
      }
    </div >
  )
}

export default Indicator