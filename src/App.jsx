import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import GChart from './components/chart'
import Indicator from './components/indicator'
import './App.css'
import Carousel from './components/Carousel'
import DomainCard from './components/DomainCard'
import PageTemplate from './Routes/PageTemplate'
import domains from '../public/domains.json'


const images = [
  "../public/14.jpg",
  "https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp",
  "https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp",
  "https://img.daisyui.com/images/stock/photo-1665553365602-b2fb8e5d1707.webp",
]


function App() {
  return (
    <>
      <PageTemplate>
        <div className="flex flex-col items-center">
          <Carousel images={images} />
          <label className="input my-4">
            <svg className="h-[1em] opacity-50 btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></g></svg>
            <input type="search" className="grow" placeholder="Procurar por Indicador" />
          </label>
          <div className='flex flex-row flex-wrap place-content-center gap-8 my-8 w-full'>
            {domains.dominios.map((domain) => (
              <DomainCard DomainTitle={domain.nome} DomainPage={domain.DomainPage} DomainColor={domain.DomainColor} DomainImage={domain.DomainImage} />
            ))}
          </div>
        </div>
      </PageTemplate>
    </>
  )
}


export default App
