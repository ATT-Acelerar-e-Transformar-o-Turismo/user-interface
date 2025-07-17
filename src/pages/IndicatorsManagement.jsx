import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagementTemplate from '../components/ManagementTemplate';
import indicatorService from '../services/indicatorService';
import domainService from '../services/domainService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

export default function IndicatorsManagement() {
  const [selectedOption, setSelectedOption] = useState('indicators');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [domains, setDomains] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const navigate = useNavigate();

  // Load data based on selected option
  useEffect(() => {
    loadData();
  }, [selectedOption, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (selectedOption === 'indicators') {
        // Load indicators with pagination
        const indicatorsData = await indicatorService.getAll(currentPage * pageSize, pageSize);
        setIndicators(indicatorsData || []);
        
        // Also load domains for mapping
        const domainsData = await domainService.getAll();
        setDomains(domainsData || []);
      } else {
        // Load domains
        const domainsData = await domainService.getAll();
        setDomains(domainsData || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    const id = item.id || item._id;
    navigate(selectedOption === 'indicators' ? `/edit_indicator/${id}` : `/edit_domain/${id}`);
  };

  const handleDelete = async (item) => {
    try {
      const id = item.id || item._id;
      if (selectedOption === 'indicators') {
        await indicatorService.delete(id);
        setIndicators(indicators.filter(indicator => (indicator.id || indicator._id) !== id));
      } else {
        await domainService.delete(id);
        setDomains(domains.filter(domain => (domain.id || domain._id) !== id));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setCurrentPage(0); // Reset pagination when switching tabs
  };

  // Prepare table content
  const tableContent = selectedOption === 'indicators' 
    ? indicators.map(indicator => {
        // Map domain data for indicators
        let domainInfo = null;
        if (indicator.domain) {
          if (typeof indicator.domain === 'object') {
            domainInfo = indicator.domain;
          } else {
            // If domain is just an ID, find it in domains array
            domainInfo = domains.find(domain => (domain.id || domain._id) === indicator.domain);
          }
        }
        
        return {
          ...indicator,
          domain: domainInfo?.name || indicator.subdomain || 'Unknown Domain',
          color: domainInfo?.color || '#CCCCCC'
        };
      })
    : domains;

  const visibleColumns =
    selectedOption === 'indicators'
      ? ['name', 'periodicity', 'domain', 'favourites', 'governance']
      : ['name', 'color'];

  const renderCellContent = (column, value, row) => {
    if (selectedOption === 'domains' && column === 'color') {
      return <span style={{ backgroundColor: row.color || '#CCCCCC' }} className="inline-block w-4 h-4 rounded-full"></span>;
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
    if (column === 'favourites') {
      return value ? <i className="fas fa-star text-yellow-500"></i> : <i className="far fa-star text-gray-400"></i>;
    }
    return value;
  };

  const actions = [
    { label: 'Edit', className: 'btn-primary', onClick: handleEdit },
    { label: 'Delete', className: 'btn-secondary', onClick: handleDelete }
  ];

  // Pagination controls
  const paginationControls = selectedOption === 'indicators' && (
    <div className="flex justify-center mt-4 gap-2">
      <button 
        className="btn btn-sm" 
        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0 || loading}
      >
        Previous
      </button>
      <span className="flex items-center px-4">
        Page {currentPage + 1}
      </span>
      <button 
        className="btn btn-sm" 
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={indicators.length < pageSize || loading}
      >
        Next
      </button>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={loadData} />;
  }

  return (
    <>
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
                onClick={() => handleOptionChange('indicators')}
              >
                Indicators
              </button>
              <button
                className={`btn ${selectedOption === 'domains' ? 'btn-primary' : 'btn-base-300'} rounded-l-none`}
                onClick={() => handleOptionChange('domains')}
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
      {paginationControls}
    </>
  );
}
