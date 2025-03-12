import React, { useState, useEffect } from 'react';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import Table from '../components/Table';

export default function NewIndicator() {
  const [tableContent, setTableContent] = useState([]);

  useEffect(() => {
    fetchTableContent();
  }, []);

  const fetchTableContent = () => {
    const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
    setTableContent(indicators);
  };

  return (
    <PageTemplate>
      <div className="flex justify-center">
        <div className="p-8 rounded-lg shadow-lg w-full ">
          <h1 className="text-xl font-bold text-center mb-6">Indicators</h1>
          <div className="flex flex-row-reverse mb-4">
            <a href="new_indicator">
              <button className="btn btn-success">Create New Indicator</button>
            </a>
          </div>

          <Table content={tableContent} />

        </div>

      </div>
    </PageTemplate>
  );
}
