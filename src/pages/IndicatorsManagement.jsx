import { useState, useEffect } from 'react';
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
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  
  const navigate = useNavigate();

  // Load data based on selected option
  useEffect(() => {
    loadData();
  }, [selectedOption, currentPage, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (selectedOption === 'indicators') {
        // Load indicators with pagination and total count
        const skip = currentPage * pageSize;
        const [indicatorsData, totalCount] = await Promise.all([
          indicatorService.getAll(skip, pageSize),
          indicatorService.getCount()
        ]);

        setIndicators(indicatorsData || []);
        setTotalItems(totalCount || 0);
        
        // Determine if there are more pages based on total count
        const hasMore = skip + pageSize < totalCount;
        setHasNextPage(hasMore);
        
        // Also load domains for mapping
        const domainsData = await domainService.getAll();
        setDomains(domainsData || []);
      } else {
        // Load domains (domains don't use pagination)
        const domainsData = await domainService.getAll();
        setDomains(domainsData || []);
        setHasNextPage(false);
        setTotalItems(domainsData?.length || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    if (!id || id === 'undefined') {
      setError('Invalid item ID. Cannot edit.');
      return;
    }
    
    navigate(selectedOption === 'indicators' ? `/edit_indicator/${id}` : `/edit_domain/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      // id is already the string ID, no need to extract it from an object
      if (selectedOption === 'indicators') {
        await indicatorService.delete(id);
        const updatedIndicators = indicators.filter(indicator => indicator.id !== id);
        setIndicators(updatedIndicators);
        
        // If we deleted the last item on this page and we're not on the first page, go back
        if (updatedIndicators.length === 0 && currentPage > 0) {
          setCurrentPage(currentPage - 1);
        }
        // Always reload data to ensure pagination state and counts are correct
        loadData();
      } else {
        await domainService.delete(id);
        setDomains(domains.filter(domain => domain.id !== id));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setCurrentPage(0); // Reset pagination when switching tabs
    setHasNextPage(false);
    setTotalItems(0);
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
            domainInfo = domains.find(domain => domain.id === indicator.domain);
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
    if (selectedOption === 'domains' && column === 'name') {
      return row.name;
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
    <div className="flex flex-col items-center mt-4 gap-2">
      <div className="flex justify-center gap-2">
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
          disabled={!hasNextPage || loading}
        >
          Next
        </button>
      </div>
      {indicators.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {currentPage * pageSize + 1} - {currentPage * pageSize + indicators.length} of {totalItems} indicators
          {totalItems > 0 && ` (Page ${currentPage + 1} of ${Math.ceil(totalItems / pageSize)})`}
        </div>
      )}
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