import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ManagementTemplate from '../components/ManagementTemplate';
import Pagination from '../components/Pagination';
import indicatorService from '../services/indicatorService';
import domainService from '../services/domainService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import { getOptimalTextColor } from '../services/colorUtils';

export default function IndicatorsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

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
  
  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [governanceFilter, setGovernanceFilter] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const navigate = useNavigate();

  // Handle search from URL parameters
  useEffect(() => {
    const search = searchParams.get('q');
    if (search) {
      setSearchQuery(search);
      setIsSearchMode(true);
      setSelectedOption('indicators'); // Force to indicators view for search
    }
  }, [searchParams]);

  // Load data based on selected option
  useEffect(() => {
    loadData();
  }, [selectedOption, currentPage, pageSize, sortBy, sortOrder, governanceFilter, searchQuery, isSearchMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (selectedOption === 'indicators') {
        const skip = currentPage * pageSize;
        
        if (isSearchMode && searchQuery.trim()) {
          // Search mode
          const searchResults = await indicatorService.search(searchQuery, pageSize, skip);
          setIndicators(searchResults || []);
          
          // For search, we estimate pagination based on results
          const hasMore = searchResults && searchResults.length === pageSize;
          setHasNextPage(hasMore);
          setTotalItems(hasMore ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + (searchResults?.length || 0));
        } else {
          // Normal mode - Load indicators with pagination and total count
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getAll(skip, pageSize, sortBy, sortOrder, governanceFilter),
            indicatorService.getCount()
          ]);

          setIndicators(indicatorsData || []);
          setTotalItems(totalCount || 0);
          
          // Determine if there are more pages based on total count
          const hasMore = skip + pageSize < totalCount;
          setHasNextPage(hasMore);
        }
        
        // Also load domains for mapping (always needed for display)
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



  // Define sortable columns for indicators
  const sortableColumns = ['name', 'periodicity', 'favourites'];
  
  const visibleColumns =
    selectedOption === 'indicators'
      ? ['name', 'periodicity', 'domain', 'favourites', 'governance']
      : ['name', 'color'];

  // Create enhanced column headers with sorting
  const enhancedColumns = selectedOption === 'indicators' 
    ? visibleColumns.map(column => ({
        key: column,
        label: column.charAt(0).toUpperCase() + column.slice(1),
        sortable: sortableColumns.includes(column),
        sorted: sortBy === column,
        sortOrder: sortBy === column ? sortOrder : null
      }))
    : visibleColumns.map(column => ({
        key: column,
        label: column.charAt(0).toUpperCase() + column.slice(1),
        sortable: false
      }));

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
      return (
        <div className="flex items-center gap-1">
          <i className={value > 0 ? "fas fa-star text-yellow-500" : "far fa-star text-gray-400"}></i>
          <span>{value || 0}</span>
        </div>
      );
    }
    return value;
  };

  // Sorting handlers
  const handleSort = (column) => {
    if (selectedOption !== 'indicators') return; // Only sort indicators
    
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(0); // Reset pagination when sorting
  };

  const handleGovernanceFilter = (value) => {
    setGovernanceFilter(value);
    setCurrentPage(0); // Reset pagination when filtering
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setCurrentPage(0);
    setSearchParams({}); // Clear URL search params
  };

  const actions = [
    { label: 'Edit', className: 'btn-primary', onClick: handleEdit },
    { label: 'Delete', className: 'btn-secondary', onClick: handleDelete }
  ];

  // Page change handler
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

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
      sortingInfo={selectedOption === 'indicators' ? { sortBy, sortOrder, handleSort, sortableColumns } : null}
      showSearchBox={false}
      headerActions={
        <div className="flex w-full mb-4 justify-between">
          <div className="flex items-center gap-4">
            {/* Search Status */}
            {isSearchMode && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <i className="fas fa-search text-primary text-sm"></i>
                <span className="text-sm font-medium">Search: "{searchQuery}"</span>
                <button
                  onClick={clearSearch}
                  className="text-primary hover:text-primary-focus transition-colors"
                  title="Clear search"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            )}
            
            {!isSearchMode && (
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
            )}
            
            {/* Governance Filter - only show for indicators and not in search mode */}
            {selectedOption === 'indicators' && !isSearchMode && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={governanceFilter === true}
                    onChange={(e) => {
                      handleGovernanceFilter(e.target.checked ? true : null);
                    }}
                  />
                  <span className="text-sm font-medium">Governance only</span>
                </label>
              </div>
            )}
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
    {selectedOption === 'indicators' && (
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        onPageChange={handlePageChange}
        loading={loading}
        showItemCount={true}
        itemName="indicators"
      />
    )}
    </>
  );
}