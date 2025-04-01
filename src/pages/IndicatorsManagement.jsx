import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTemplate from './PageTemplate';
import Table from '../components/Table';
import { useDomain } from '../contexts/DomainContext';

export default function IndicatorsManagement() {
  const [selectedOption, setSelectedOption] = useState('indicators');
  const navigate = useNavigate();
  const { domains, indicators, deleteDomain, deleteIndicator } = useDomain();

  const tableContent = selectedOption === 'indicators' 
    ? indicators.map(indicator => ({
        ...indicator,
        color: domains.find(domain => domain.name === indicator.domain)?.color
      }))
    : domains;

  const handleEdit = (id) => {
    if (selectedOption === 'indicators') {
      navigate(`/edit_indicator/${id}`);
    } else {
      navigate(`/edit_domain/${id}`);
    }
  }

  const handleDelete = (id) => {
    if (selectedOption === 'indicators') {
      deleteIndicator(id);
    } else {
      deleteDomain(id);
    }
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
        <span style={{ borderColor: row.color }} className="inline-block px-2 py-1 rounded-full border-2 w-full text-center">
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
