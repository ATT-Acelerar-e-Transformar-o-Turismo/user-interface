import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import ActionCard from '../components/ActionCard';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import DomainWizard from '../components/wizard/DomainWizard';
import domainService from '../services/domainService';
import indicatorService from '../services/indicatorService';

export default function DomainsManagement() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isDomainWizardOpen, setIsDomainWizardOpen] = useState(false);
  const [editingDomainId, setEditingDomainId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadDomains();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const loadDomains = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all domains
      const domainsData = await domainService.getAll();

      // Enhance domains with indicator counts and subdomain counts
      const enhancedDomainsPromises = domainsData.map(async (domain) => {
        const subdomainCount = (domain.subdomains || domain.subdominios || []).length;

        // Use the count endpoint for efficiency
        let indicatorCount = 0;
        try {
          indicatorCount = await indicatorService.getCountByDomain(domain.id);
        } catch (err) {
          console.warn(`Failed to get indicator count for domain ${domain.id}:`, err);
        }

        return {
          ...domain,
          indicatorCount,
          subdomainCount
        };
      });

      const enhancedDomains = await Promise.all(enhancedDomainsPromises);

      // Apply search filter
      let filteredDomains = enhancedDomains;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredDomains = enhancedDomains.filter(domain =>
          domain.name.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      filteredDomains.sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'indicatorCount') {
          comparison = a.indicatorCount - b.indicatorCount;
        } else if (sortBy === 'subdomainCount') {
          comparison = a.subdomainCount - b.subdomainCount;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      setTotalItems(filteredDomains.length);
      const start = currentPage * pageSize;
      const end = start + pageSize;
      const paginatedDomains = filteredDomains.slice(start, end);

      setDomains(paginatedDomains);

    } catch (err) {
      setError(err.message || 'Falha ao carregar domínios');
      console.error('Error loading domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (domain) => {
    setEditingDomainId(domain.id);
    setIsDomainWizardOpen(true);
  };

  const handleDelete = async (domain) => {
    if (!window.confirm(`Tem certeza que deseja eliminar o domínio "${domain.name}"?`)) {
      return;
    }

    try {
      await domainService.delete(domain.id);
      loadDomains();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar domínio');
      console.error('Error deleting domain:', err);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(0);
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
        <ErrorDisplay error={error} onRetry={loadDomains} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminNavbar />

      <div className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Edit Panel Link */}
          <div className="absolute top-6 right-6">
            <button className="text-base font-['Inter',sans-serif] font-medium text-black hover:text-gray-600 transition-colors">
              Editar painel
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Left Column - Domains Table */}
            <div className="bg-[#f1f0f0] rounded-[23px] p-8">
              <h1 className="font-['Onest',sans-serif] font-semibold text-4xl text-black mb-6">
                Domínios
              </h1>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-4">
                <button
                  onClick={() => handleSort('name')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-left hover:text-[#00855d] flex items-center gap-1"
                >
                  Nome
                  {sortBy === 'name' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {sortOrder === 'asc' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleSort('subdomainCount')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-center hover:text-[#00855d] flex items-center justify-center gap-1"
                >
                  Dimensões
                  {sortBy === 'subdomainCount' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {sortOrder === 'asc' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleSort('indicatorCount')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-center hover:text-[#00855d] flex items-center justify-center gap-1"
                >
                  Indicadores
                  {sortBy === 'indicatorCount' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {sortOrder === 'asc' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  )}
                </button>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-right">Opções</p>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {domains.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Ainda não existem domínios
                  </div>
                ) : (
                  domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="bg-[#d9d9d9] rounded-lg p-4 grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center hover:bg-gray-300 transition-colors"
                    >
                      {/* Name with Color Badge */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: domain.color || '#CCCCCC' }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <span className="font-['Onest',sans-serif] font-normal text-sm text-black">
                          {domain.name}
                        </span>
                      </div>

                      {/* Subdomain Count */}
                      <div className="flex justify-center">
                        <span className="font-['Onest',sans-serif] font-medium text-sm text-black">
                          {domain.subdomainCount}
                        </span>
                      </div>

                      {/* Indicator Count */}
                      <div className="flex justify-center">
                        <span className="font-['Onest',sans-serif] font-medium text-sm text-black">
                          {domain.indicatorCount}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(domain)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(domain)}
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
              {domains.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    hasNextPage={currentPage * pageSize + domains.length < totalItems}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showItemCount={true}
                    itemName="domínios"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Action Cards */}
            <div className="flex flex-col gap-6">
              <ActionCard
                icon={
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
                title={`Adicionar\nDomínio`}
                onClick={() => {
                  setEditingDomainId(null);
                  setIsDomainWizardOpen(true);
                }}
                className="w-[210px]"
              />

              <div className="bg-[#f1f0f0] rounded-[23px] p-6 w-[210px]">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">
                  Total: {totalItems} domínios
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Wizard Modal */}
      <DomainWizard
        isOpen={isDomainWizardOpen}
        onClose={() => {
          setIsDomainWizardOpen(false);
          setEditingDomainId(null);
        }}
        domainId={editingDomainId}
        onSuccess={() => {
          loadDomains();
        }}
      />
    </div>
  );
}
