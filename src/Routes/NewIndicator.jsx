import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';

export default function NewIndicator() {
  const { indicatorId } = useParams();
  const [indicatorData, setIndicatorData] = useState({
    name: '',
    domain: '',
    category: '',
    description: '',
    font: '',
    scale: ''
  });

  useEffect(() => {
    if (indicatorId) {
      const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
      const indicator = indicators.find(ind => ind.id === parseInt(indicatorId));
      if (indicator) {
        setIndicatorData(indicator);
      }
    }
  }, [indicatorId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setIndicatorData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSave = () => {
    const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
    if (indicatorId) {
      const index = indicators.findIndex(ind => ind.id === parseInt(indicatorId));
      if (index !== -1) {
        indicators[index] = indicatorData;
      }
    } else {
      indicatorData.id = indicators.length ? indicators[indicators.length - 1].id + 1 : 1;
      indicators.push(indicatorData);
    }
    localStorage.setItem('indicators', JSON.stringify(indicators));
  };

  return (
    <PageTemplate>
      <div className="flex justify-center min-h-screen">
        <div className="p-8 rounded-lg shadow-lg w-full ">
          <h1 className="text-xl font-bold text-center mb-6">
            {indicatorId ? 'Edit Indicator' : 'New Indicator'}
          </h1>

          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-neutral">Name</label>
              <input type="text" id="name" value={indicatorData.name} onChange={handleChange} className="bg-base-100 border border-base-300 text-neutral text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5" />
            </div>

            <div className='border border-base-100 w-fit rounded-lg'>
              <SelectDomain />
            </div>

            <div className='border border-base-100 w-fit rounded-lg'>
              <CategoryDropdown />
            </div>

            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-neutral">Description</label>
              <textarea
                id="description"
                value={indicatorData.description}
                onChange={handleChange}
                rows="4"
                className="block w-full p-4 text-neutral border border-base-300 rounded-lg bg-base-100 text-base focus:ring-primary focus:border-primary resize-none"
              />
            </div>

            <div>
              <label htmlFor="font" className="block mb-2 text-sm font-medium text-neutral">Font</label>
              <input type="text" id="font" value={indicatorData.font} onChange={handleChange} className="block w-full p-2 text-neutral border border-base-300 rounded-lg bg-base-100 text-xs focus:ring-primary focus:border-primary" />
            </div>

            <div>
              <label htmlFor="scale" className="block mb-2 text-sm font-medium text-neutral">Scale</label>
              <input type="text" id="scale" value={indicatorData.scale} onChange={handleChange} className="block w-full p-2 text-neutral border border-base-300 rounded-lg bg-base-100 text-xs focus:ring-primary focus:border-primary" />
            </div>

          </form>
          <div className='flex justify-end w-full mt-4'>
            <button onClick={handleSave} className="btn btn-primary">
              {indicatorId ? 'Update' : 'Save'}
            </button>
            <AddDataDropdown />
          </div>

        </div>

      </div>
    </PageTemplate >
  );
}
