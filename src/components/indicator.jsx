import React, { useEffect, useState } from 'react'
import GChart from './chart'
//import Views from './views'
//import Filter from './filter'
import { useWindowSize } from '../hooks/useWindowSize'

const Indicator = ({ title, period }) => {
  const { width } = useWindowSize();
  
  const [chartData, setChartData] = useState([{
    chartType: 'line',
    // title: 'Sales',
    xaxisType: 'datetime', // 'datetime', 'category' or 'numeric'
    // log: 10, // null for linear, x for log base x
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
  }]);

  const availableFilters = {
    segment: ['B2B', 'B2C'],
  };

  const [activeFilters, setActiveFilters] = useState({
    segment: ['B2B', 'B2C']
  });

  // Efeito para atualizar hidden baseado nos filtros ativos
  useEffect(() => {
    setChartData(prev => ({
      ...prev,
      series: prev.series.map(serie => ({
        ...serie,
        hidden: !activeFilters.segment.includes(serie.name.split(' ')[0])
      }))
    }));
  }, [activeFilters]);

  const handleFilterChange = (filterGroup, values) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterGroup]: values
    }));
  };

  const [activeView, setActiveView] = useState('line');

  const handleViewChange = (newView) => {
    setActiveView(newView);
    setChartData(prev => ({
      ...prev,
      chartType: newView
    }));
  };

  return (
    <div className='mx-2'>
      <h2 className='text-2xl font-bold'>{title}</h2>
      <p className='text-sm text-neutral'>{period}</p>

      {/* Desktop */}
      <div className='hidden md:block'>
        <label className="sr-only">Example range</label>
        <div data-hs-range-slider='{
    "start": [25, 75],
    "range": {
      "min": 0,
      "max": 100
    },
    "connect": true,
    "cssClasses": {
      "target": "relative h-2 rounded-full bg-gray-100 dark:bg-neutral-700",
      "base": "w-full h-full relative z-1",
      "origin": "absolute top-0 end-0 w-full h-full origin-[0_0] rounded-full",
      "handle": "absolute top-1/2 end-0 w-[1.125rem] h-[1.125rem] bg-white border-4 border-blue-600 rounded-full cursor-pointer translate-x-2/4 -translate-y-2/4 dark:border-blue-500",
      "connects": "relative z-0 w-full h-full rounded-full overflow-hidden",
      "connect": "absolute top-0 end-0 z-1 w-full h-full bg-blue-600 origin-[0_0] dark:bg-blue-500",
      "touchArea": "absolute -top-1 -bottom-1 -start-1 -end-1"
    }
  }'></div>

        <div className='flex flex-row'>
          {/* <Filter 
            filters={availableFilters}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          /> */}
          <div className='flex-grow'>
            <GChart {...chartData} height={500} />
          </div>
          <div className='flex flex-col gap-2'>
            {/* <Views 
              size={width > 640 ? 'sm' : 'xs'} 
              activeView={activeView}
              onViewChange={handleViewChange}
            /> */}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className='md:hidden w-full'>
        <div className='flex flex-row'>
          {/** <Filter 
            filters={availableFilters}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          /> */}

          <div className='flex-grow'></div>

          <div className='flex flex-row gap-2 mt-6 mb-4'>
            {/* <Views 
              size={width > 640 ? 'sm' : 'xs'} 
              activeView={activeView}
              onViewChange={handleViewChange}
            /> */}
          </div>

        </div>
        <GChart {...chartData} height={500} />
      </div>

    </div>
  )
}

export default Indicator