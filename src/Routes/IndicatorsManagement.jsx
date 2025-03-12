import React, { useState, useEffect } from 'react';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import Table from '../components/Table';

export default function IndicatorsManagement() {
  const [tableContent, setTableContent] = useState([]);
  const [selectedOption, setSelectedOption] = useState('indicators');

  useEffect(() => {
    fetchTableContent();
  }, [selectedOption]);

  const fetchTableContent = () => {
    const data = JSON.parse(localStorage.getItem(selectedOption)) || [];
    setTableContent(data);
  };

  return (
    <PageTemplate>
      <div className="flex mb-4">
        <button
          className={`btn ${selectedOption === 'indicators' ? 'btn-primary' : 'btn-base-300'} rounded-r-none`}
          onClick={() => setSelectedOption('indicators')}
        >
          Indicators
        </button>
        <button
          className={`btn ${selectedOption === 'domains' ? 'btn-primary' : 'btn-base-300'} rounded-l-none`}
          onClick={() => setSelectedOption('domains')}
        >
          Domains
        </button>
      </div>
      <div className="flex justify-center">
        <div className="p-8 rounded-lg shadow-lg w-full ">
          <h1 className="text-xl font-bold text-center mb-6">
            {selectedOption === 'indicators' ? 'Indicators' : 'Domains'}
          </h1>
          <div className="flex flex-row-reverse mb-4">
            <a href={selectedOption === 'indicators' ? 'new_indicator' : 'new_domain'}>
              <button className="btn btn-success">
                {selectedOption === 'indicators' ? 'Create New Indicator' : 'Create New Domain'}
              </button>
            </a>
          </div>

          <Table 
            content={tableContent} 
            emptyMessage={`There are no ${selectedOption} yet`} 
          />

        </div>

      </div>
    </PageTemplate>
  );
}
