import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import Table from '../components/Table';

export default function IndicatorsManagement() {
  const [tableContent, setTableContent] = useState([]);
  const [selectedOption, setSelectedOption] = useState('indicators');
  const navigate = useNavigate();

  const fetchTableContent = () => {
    const data = JSON.parse(localStorage.getItem(selectedOption)) || [];
    if (selectedOption === 'indicators') {
      const domains = JSON.parse(localStorage.getItem('domains')) || [];
      const domainMap = domains.reduce((acc, domain) => {
        acc[domain.name] = domain.color;
        return acc;
      }, {});
      data.forEach(indicator => {
        indicator.color = domainMap[indicator.domain];
      });
    }
    console.log(data)
    setTableContent(data);
  };

  useEffect(() => {
    fetchTableContent();
  }, [selectedOption]);

  useEffect(() => {
    fetchTableContent();
  }, []);

  const handleEdit = (id) => {
    if (selectedOption === 'indicators') {
      navigate(`/edit_indicator/${id}`);
    } else {
      navigate(`/edit_domain/${id}`);
    }
  }

  const handleDelete = (id) => {
    const data = JSON.parse(localStorage.getItem(selectedOption)) || [];
    const updatedData = data.filter(i => i.id !== id);
    localStorage.setItem(selectedOption, JSON.stringify(updatedData));
    fetchTableContent();
  };

  const editAction = (id) => {
    navigate(`/edit_indicator/${id}`);
  };

  const visibleColumns = selectedOption === 'indicators' 
    ? ['name', 'periodicity', 'domain', 'favourites', 'governance'] 
    : ['name', 'color'];

  const renderCellContent = (column, value, row) => {
    if (selectedOption === 'domains' && column === 'color') {
      return <span style={{ backgroundColor: value }} className="inline-block w-4 h-4 rounded-full"></span>;
    }
    if (selectedOption === 'indicators' && column === 'domain') {
      return (
        <span style={{ borderColor: row.color }} className="inline-block px-2 py-1 rounded-full border-2">
          {value}
        </span>
      );
    }
    if (column === 'governance') {
      return value ? <i className="fas fa-check-circle text-green-500"></i> : <i className="fas fa-times-circle text-red-500"></i>;
    }
    return value;
  };

  const actions = [
    {
      label: 'Edit',
      className: 'btn-primary',
      onClick: handleEdit
    },
    {
      label: 'Delete',
      className: 'btn-secondary',
      onClick: handleDelete
    }
  ];

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
            content={tableContent.map(row => ({
              ...row,
              color: renderCellContent('color', row.color, row),
              domain: renderCellContent('domain', row.domain, row),
              governance: renderCellContent('governance', row.governance, row)
            }))} 
            emptyMessage={`There are no ${selectedOption} yet`} 
            visibleColumns={visibleColumns}
            actions={actions}
          />

        </div>

      </div>
    </PageTemplate>
  );
}
