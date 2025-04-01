import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import { useNavigate } from 'react-router-dom';

export default function NewIndicator() {

  const [isCarryingCapacityChecked, setIsCarryingCapacityChecked] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    font: '',
    scale: '',
    unit: '',
    periodicity: '',
    domain: '',
    subdomain: '',
    governance: false,
    carrying_capacity: false,
  });

  const setSelectedDomain = (domain) => {
    console.log("selected domain: " + domain);
    setFormData((prevFormData) => ({
      ...prevFormData,
      domain: domain,
      subdomain: ''
    }));
    console.log(formData);
  };

  const setSelectedSubdomain = (subdomain) => {
    console.log("selected subdomain: " + subdomain);
    setFormData((prevFormData) => ({
      ...prevFormData,
      subdomain: subdomain
    }));
    console.log(formData);
  };

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const submitData = () => {
    const indicatorData = {
      ...formData,
      favourites: 0,
    }
    const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
    let id;
    if (indicatorId) {
      id = parseInt(indicatorId);
      const index = indicators.findIndex(ind => ind.id === id);
      console.log(indicatorData)
      if (index !== -1) {
        indicators[index] = indicatorData;
      }
    } else {
      // random big index
      id = Math.floor(Math.random() * 10000 + 200);
      indicatorData.id = id;
      indicators.push(indicatorData);
    }
    localStorage.setItem('indicators', JSON.stringify(indicators));
    return id;
  }

  const handleGovernanceChange = (e) => {
    setFormData({ ...formData, governance: e.target.checked });
  };

  const handleCarryingCapacityChange = (e) => {
    setFormData({ ...formData, carrying_capacity: false });  // Reset carrying capacity value when unchecked
    setIsCarryingCapacityChecked(e.target.checked);
  };

  const { indicatorId } = useParams();

  useEffect(() => {
    if (indicatorId) {
      const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
      const indicator = indicators.find(ind => ind.id === parseInt(indicatorId));
      if (indicator) {
        setFormData(indicator);
      }
    }
  }, [indicatorId]);

  const handleSave = () => {
    submitData();
    navigate('/indicators-management');
  };

  const handleAddData = () => {
    const id = submitData();
    navigate('/resources-management/' + id);
  }

  return (
    <PageTemplate>
      <div className="flex justify-center">
        <div className="p-8 rounded-lg shadow-lg w-full ">
          <h1 className="text-xl font-bold text-center mb-6">
            {indicatorId ? 'Edit Indicator' : 'New Indicator'}
          </h1>
          <form className="space-y-5">
            <div>
              <label htmlFor="large-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
              <input type="text" id="name" onChange={handleChange} value={formData.name} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
            </div>

            <div className='border border-bg-50 w-fit dark:border-gray-600 rounded-lg'>
              <SelectDomain
                setSelectedDomain={setSelectedDomain}
                setSelectedSubdomain={setSelectedSubdomain}
              />
            </div>

            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-neutral">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="block w-full p-4 text-neutral border border-base-300 rounded-lg bg-base-100 text-base focus:ring-primary focus:border-primary resize-none"
              />
            </div>

            <div>
              <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Unit</label>
              <input type="text" value={formData.unit} onChange={handleChange} id="unit" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
            </div>

            <div>
              <label htmlFor="font" className="block mb-2 text-sm font-medium text-neutral">Source</label>
              <input type="text" id="font" value={formData.font} onChange={handleChange} className="block w-full p-2 text-neutral border border-base-300 rounded-lg bg-base-100 text-xs focus:ring-primary focus:border-primary" />
            </div>

            <div>
              <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Scale</label>
              <input type="text" value={formData.scale} onChange={handleChange} id="scale" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="checkbox"
                id='governance'
                checked={formData.governance}
                onChange={handleGovernanceChange}
              />
              <label htmlFor="governance-checkbox" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Governance Indicator</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="checkbox"
                checked={isCarryingCapacityChecked}
                onChange={handleCarryingCapacityChange}
              />
              <label htmlFor="carrying-capacity-checkbox" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Carrying Capacity</label>
            </div>

            {isCarryingCapacityChecked && (
              <div>
                <label htmlFor="carrying-capacity-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Carrying Capacity Limit Value</label>
                <input
                  type="text"
                  onChange={handleChange}
                  id="carrying_capacity"
                  className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
              </div>
            )}

            <div>
              <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Periodicity</label>
              <input type="text" value={formData.periodicity} onChange={handleChange} id="periodicity" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
            </div>
          </form>
        </div>
      </div>
      <div className='flex justify-end w-full mt-4'>
        <button onClick={handleSave} className="btn btn-primary m-1">
          {indicatorId ? 'Update' : 'Save'}
        </button>
        <button onClick={handleAddData} className='btn m-1'>
          Add Data
        </button>
      </div>
    </PageTemplate >
  );
}
