import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagementTemplate from '../components/ManagementTemplate';
import { useDomain } from '../contexts/DomainContext';

export default function IndicatorsManagement() {
  const [selectedOption, setSelectedOption] = useState('indicators');
  const navigate = useNavigate();
  const { domains, indicators, deleteDomain, deleteIndicator } = useDomain();

  const tableContent =
    selectedOption === 'indicators'
      ? indicators.map(indicator => {
          const foundDomain = domains.find(domain => domain.nome === (indicator.domain?.nome || indicator.domain));
          return {
            ...indicator,
            color: foundDomain?.DomainColor
          };
        })
      : domains;

  const handleEdit = (id) =>
    navigate(selectedOption === 'indicators' ? `/edit_indicator/${id}` : `/edit_domain/${id}`);
  const handleDelete = (id) =>
    selectedOption === 'indicators' ? deleteIndicator(id) : deleteDomain(id);

  const visibleColumns =
    selectedOption === 'indicators'
      ? ['name', 'periodicity', 'domain', 'favourites', 'governance']
      : ['name', 'color'];

  const renderCellContent = (column, value, row) => {
    if (selectedOption === 'domains' && column === 'color') {
      console.log(value)
      return <span style={{ backgroundColor: row.DomainColor || '#CCCCCC' }} className="inline-block w-4 h-4 rounded-full"></span>;
    }
    if (selectedOption === 'indicators' && column === 'domain') {
      return (
        <span style={{ borderColor: row.color }} className="inline-block px-2 py-1 rounded-full border-2 w-full text-center">
          {value}
        </span>
      );
    }
    if (selectedOption === 'domains' && column === 'name') {
      return row.nome;
    }
    if (column === 'governance') {
      return value ? <i className="fas fa-check-circle text-green-500"></i> : <i className="fas fa-times-circle text-red-500"></i>;
    }
    return value;
  };

  const actions = [
    { label: 'Edit', className: 'btn-primary', onClick: handleEdit },
    { label: 'Delete', className: 'btn-secondary', onClick: handleDelete }
  ];

  return (
    <ManagementTemplate
      title={selectedOption === 'indicators' ? 'Indicators' : 'Domains'}
      tableContent={tableContent}
      emptyMessage={`There are no ${selectedOption} yet`}
      visibleColumns={visibleColumns}
      actions={actions}
      renderCellContent={renderCellContent}
      headerActions={
        <div className="flex w-full mb-4 justify-between">
          <div>
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
          <div className='flex-grow'></div>
          <a href={selectedOption === 'indicators' ? 'new_indicator' : 'new_domain'}>
            <button className="btn btn-success">
              {selectedOption === 'indicators' ? 'Create New Indicator' : 'Create New Domain'}
            </button>
          </a>
        </div>
      }
    />
  );
}
