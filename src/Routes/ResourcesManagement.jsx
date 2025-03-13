import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageTemplate from './PageTemplate';
import Table from '../components/Table';

export default function ResourcesManagement() {
  const { indicator } = useParams(); // Get indicator ID from route parameters
  const [tableContent, setTableContent] = useState([]);
  const [indicatorName, setIndicatorName] = useState('');

  const fetchTableContent = () => {
    const data = JSON.parse(localStorage.getItem('resources')) || [];
    const filteredData = data.filter(resource => resource.indicator === parseInt(indicator));
    setTableContent(filteredData);
  };

  const fetchIndicatorName = () => {
    const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
    const indicatorData = indicators.find(ind => ind.id === parseInt(indicator));
    setIndicatorName(indicatorData ? indicatorData.name : 'Unknown Indicator');
  };

  const deleteAction = (resourceId) => {
    const data = JSON.parse(localStorage.getItem('resources')) || [];
    const updatedData = data.filter(resource => resource.id !== resourceId);
    localStorage.setItem('resources', JSON.stringify(updatedData));
    fetchTableContent(); // Refresh table content
  };

  useEffect(() => {
    fetchTableContent();
    fetchIndicatorName();
  }, [indicator]);

  const visibleColumns = ['name', 'start period', 'end period'];

  return (
    <PageTemplate>
      <div className="flex justify-center">
        <div className="p-8 rounded-lg shadow-lg w-full">
          <h1 className="text-xl font-bold text-center mb-6">{indicatorName} - Resources</h1>
          <div className="flex flex-row-reverse mb-4">
            <a href="new_resource">
              <button className="btn btn-success">Create New Resource</button>
            </a>
          </div>
          <Table 
            content={tableContent} 
            emptyMessage="There are no resources yet" 
            visibleColumns={visibleColumns}
            deleteAction={deleteAction} // Pass deleteAction to Table
          />
        </div>
      </div>
    </PageTemplate>
  );
}
