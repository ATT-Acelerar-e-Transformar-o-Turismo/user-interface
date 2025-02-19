import React, { useEffect, useState } from 'react'
import GChart from './chart'

const data = {
  chartType: 'line',
  // title: 'Sales',
  xaxisType: 'numeric', // 'datetime', 'category' or 'numeric'
  // log: 10, // null for linear, x for log base x
  horizontal: false, // only affects bar charts
  series: [
    {
      name: 'Sales',
      //shape: 'circle', // 'circle' (default), 'diamond', 'triangle', 'cross', 'plus', 'square', 'line', 'circle', 'star', 'sparkle'
      data: [{
        x: 10,
        y: 30
      },
      {
        x: 20,
        y: 40
      },
      {
        x: 30,
        y: 35
      },
      {
        x: 40,
        y: 50
      },
      {
        x: 50,
        y: 49
      },
      {
        x: 60,
        y: 60
      },
      {
        x: 70,
        y: 70
      },
      {
        x: 80,
        y: 91
      },
      {
        x: 90,
        y: 125
      },
      {
        x: 100,
        y: 100
      },
      {
        x: 110,
        y: 200
      },
      {
        x: 120,
        y: 150
      }
      ]
    }
  ]
}

const Indicator = ({ title, period }) => {
  return (
    <div>
      <h2 className='text-2xl font-bold'>{title}</h2>
      <p className='text-sm text-neutral-content'>{period}</p>


      <label class="sr-only">Example range</label>
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
        <details className="dropdown">
          <summary className="btn mt-6 ml-1 w-24">Filters &#x25BC;</summary>
          <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
          </ul>
        </details>
        <div className='flex-grow'>
          <GChart {...data} height={500} />
        </div>
      </div>
    </div>
  )
}

export default Indicator