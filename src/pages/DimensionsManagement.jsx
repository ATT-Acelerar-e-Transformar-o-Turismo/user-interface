import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import ActionCard from '../components/ActionCard';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import AddDimensionModal from '../components/wizard/AddDimensionModal';
import domainService from '../services/domainService';
import indicatorService from '../services/indicatorService';

export default function DimensionsManagement() {
  const [dimensions, setDimensions] = useState([]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadDimensions();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all domains (which contain subdomains)
      const domains = await domainService.getAll();

      // Extract subdomains from domains and count indicators
      const dimensionsListPromises = [];

      domains.forEach(domain => {
        const subdomains = domain.subdomains || domain.subdominios || [];

        subdomains.forEach(subdomain => {
          const subdomainName = typeof subdomain === 'string' ? subdomain : subdomain.name;

          // Create a promise to get the indicator count for this subdomain
          const dimensionPromise = (async () => {
            let indicatorCount = 0;
            try {
              indicatorCount = await indicatorService.getCountBySubdomain(domain.id, subdomainName);
            } catch (err) {
              console.warn(`Failed to get indicator count for subdomain ${subdomainName}:`, err);
            }

            return {
              id: `${domain.id}-${subdomainName}`, // Composite ID
              name: subdomainName,
              description: `Subdomínio de ${domain.name}`,
              domainId: domain.id,
              domainName: domain.name,
              domainColor: domain.color,
              indicatorCount: indicatorCount
            };
          })();

          dimensionsListPromises.push(dimensionPromise);
        });
      });

      const dimensionsList = await Promise.all(dimensionsListPromises);

      // Apply search filter
      let filteredDimensions = dimensionsList;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredDimensions = dimensionsList.filter(dim =>
          dim.name.toLowerCase().includes(query) ||
          dim.domainName.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      filteredDimensions.sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'indicatorCount') {
          comparison = a.indicatorCount - b.indicatorCount;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      setTotalItems(filteredDimensions.length);
      const start = currentPage * pageSize;
      const end = start + pageSize;
      const paginatedDimensions = filteredDimensions.slice(start, end);

      setDimensions(paginatedDimensions);

    } catch (err) {
      setError(err.message || 'Falha ao carregar dimensões');
      console.error('Error loading dimensions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dimension) => {
    // Navigate to domain edit with subdomain context
    navigate(`/edit_domain/${dimension.domainId}`, {
      state: { highlightSubdomain: dimension.name }
    });
  };

  const handleDelete = async (dimension) => {
    if (!window.confirm(`Tem certeza que deseja eliminar a dimensão "${dimension.name}"?`)) {
      return;
    }

    try {
      // To delete a subdomain, we need to update the domain
      const domain = await domainService.getById(dimension.domainId);
      const subdomains = (domain.subdomains || domain.subdominios || [])
        .filter(sub => {
          const subName = typeof sub === 'string' ? sub : sub.name;
          return subName !== dimension.name;
        });

      await domainService.patch(dimension.domainId, {
        subdomains: subdomains
      });

      // Reload dimensions
      loadDimensions();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar dimensão');
      console.error('Error deleting dimension:', err);
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
        <ErrorDisplay error={error} onRetry={loadDimensions} />
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
            <button className="text-base font-['Onest',sans-serif] font-medium text-black hover:text-gray-600 transition-colors">
              Editar painel
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Left Column - Dimensions Table */}
            <div className="bg-[#f1f0f0] rounded-[23px] p-8">
              <h1 className="font-['Onest',sans-serif] font-semibold text-4xl text-black mb-6">
                Dimensões
              </h1>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 mb-4">
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
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">Domínio</p>
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
                {dimensions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Ainda não existem dimensões
                  </div>
                ) : (
                  dimensions.map((dimension) => (
                    <div
                      key={dimension.id}
                      className="bg-[#d9d9d9] rounded-lg p-4 grid grid-cols-[2fr_2fr_1fr_auto] gap-4 items-center hover:bg-gray-300 transition-colors"
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <span className="font-['Onest',sans-serif] font-normal text-sm text-black">
                          {dimension.name}
                        </span>
                      </div>

                      {/* Domain Badge */}
                      <div className="flex justify-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full bg-white border-2 text-xs font-medium text-center"
                          style={{ borderColor: dimension.domainColor || '#CCCCCC' }}
                        >
                          {dimension.domainName}
                        </span>
                      </div>

                      {/* Indicator Count */}
                      <div className="flex justify-center">
                        <span className="font-['Onest',sans-serif] font-medium text-sm text-black">
                          {dimension.indicatorCount}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(dimension)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(dimension)}
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
              {dimensions.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    hasNextPage={currentPage * pageSize + dimensions.length < totalItems}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showItemCount={true}
                    itemName="dimensões"
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
                title={`Adicionar\nDimensão`}
                onClick={() => setIsAddModalOpen(true)}
                className="w-[210px]"
              />

              <div className="bg-[#f1f0f0] rounded-[23px] p-6 w-[210px]">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">
                  Total: {totalItems} dimensões
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Dimension Modal */}
      <AddDimensionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Reload dimensions after adding
          loadDimensions();
        }}
      />
    </div>
  );
}
