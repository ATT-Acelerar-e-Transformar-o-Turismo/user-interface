import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Pagination from '../components/Pagination';
import indicatorService from '../services/indicatorService';
import domainService from '../services/domainService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import ActionCard from '../components/ActionCard';
import AdminNavbar from '../components/AdminNavbar';
import IndicatorWizard from '../components/wizard/IndicatorWizard';

export default function IndicatorsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedOption, setSelectedOption] = useState('indicators');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [domains, setDomains] = useState([]);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingIndicatorId, setEditingIndicatorId] = useState(null);
  
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

    if (selectedOption === 'indicators') {
      // Open wizard for editing indicator
      setEditingIndicatorId(id);
      setIsWizardOpen(true);
    } else {
      // Navigate to domain edit page (not yet migrated to wizard)
      navigate(`/edit_domain/${id}`);
    }
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
    if (selectedOption === 'indicators' && column === 'name') {
      return (
        <button
          onClick={() => navigate(`/resources-management/${row.id}`)}
          className="text-primary hover:underline cursor-pointer text-left w-full"
        >
          {value}
        </button>
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
    return (
      <div className="min-h-screen bg-white">
        <AdminNavbar />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <AdminNavbar />
        <ErrorDisplay error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Navbar */}
      <AdminNavbar />

      {/* Main Content Area */}
      <div className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Edit Panel Link */}
          <div className="absolute top-6 right-6">
            <button className="text-base font-['Onest',sans-serif] font-medium text-black hover:text-gray-600 transition-colors">
              Editar painel
            </button>
          </div>

          {/* Grid Layout: Left = Table, Right = Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Left Column - Indicators Table */}
            <div className="bg-[#f1f0f0] rounded-[23px] p-8">
              {/* Title */}
              <h1 className="font-['Onest',sans-serif] font-semibold text-4xl text-black mb-6">
                Indicadores
              </h1>

              {/* Table Header Row */}
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-4">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black">Nome</p>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">Dimensão</p>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">Governança</p>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-right">Opções</p>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {tableContent.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Ainda não existem indicadores
                  </div>
                ) : (
                  tableContent.map((indicator) => (
                    <div
                      key={indicator.id}
                      className="bg-[#d9d9d9] rounded-lg p-4 grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center hover:bg-gray-300 transition-colors"
                    >
                      {/* Indicator Name with Icon */}
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <button
                          onClick={() => navigate(`/resources-management/${indicator.id}`)}
                          className="font-['Onest',sans-serif] font-normal text-sm text-black hover:underline text-left"
                        >
                          {indicator.name}
                        </button>
                      </div>

                      {/* Domain Badge */}
                      <div className="flex justify-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full bg-white border-2 text-xs font-medium text-center"
                          style={{ borderColor: indicator.color || '#CCCCCC' }}
                        >
                          {indicator.domain}
                        </span>
                      </div>

                      {/* Governance Icon */}
                      <div className="flex justify-center">
                        {indicator.governance ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(indicator.id)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja eliminar o indicador "${indicator.name}"?`)) {
                              handleDelete(indicator.id);
                            }
                          }}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {selectedOption === 'indicators' && tableContent.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    hasNextPage={hasNextPage}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showItemCount={true}
                    itemName="indicadores"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Action Cards */}
            <div className="flex flex-col gap-6">
              {/* Add Indicator Card */}
              <ActionCard
                icon={
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title={`Adicionar\nIndicador`}
                onClick={() => {
                  setEditingIndicatorId(null);
                  setIsWizardOpen(true);
                }}
                className="w-[210px]"
              />

              {/* View Drafts Card */}
              <ActionCard
                icon={
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title={`Ver\nRascunhos`}
                onClick={() => alert('Ver Rascunhos - Funcionalidade em desenvolvimento')}
                className="w-[210px]"
              />

              {/* Additional Info Card */}
              <div className="bg-[#f1f0f0] rounded-[23px] p-6 w-[210px]">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">
                  Total: {totalItems} indicadores
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Wizard Modal */}
      <IndicatorWizard
        key="indicator-wizard"
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setEditingIndicatorId(null);
        }}
        indicatorId={editingIndicatorId}
        onSuccess={() => {
          // Reload indicators after successful create/update
          loadData();
        }}
      />
    </div>
  );
}