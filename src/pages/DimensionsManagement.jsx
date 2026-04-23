import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminPageTemplate from './AdminPageTemplate';
import ActionCard from '../components/ActionCard';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import AddDimensionModal from '../components/wizard/AddDimensionModal';
import SuccessModal from '../components/wizard/SuccessModal';
import areaService from '../services/areaService';
import indicatorService from '../services/indicatorService';
import useLocalizedName from '../hooks/useLocalizedName';
import { confirmAction } from '../utils/confirm';

export default function DimensionsManagement() {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '0', 10);
    return Number.isFinite(p) && p >= 0 ? p : 0;
  });
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    const urlPage = parseInt(newParams.get('page') || '0', 10) || 0;
    if (urlPage === currentPage) return;
    if (currentPage > 0) newParams.set('page', String(currentPage));
    else newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  }, [currentPage]);

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDimension, setEditingDimension] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadDimensions();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all areas (which contain dimensions)
      const areas = await areaService.getAll();

      // Extract dimensions from areas and count indicators
      const dimensionsListPromises = [];

      areas.forEach(area => {
        const dimensions = area.dimensions || area.subdominios || [];

        dimensions.forEach(dimension => {
          const dimensionName = typeof dimension === 'string' ? dimension : dimension.name;
          const dimensionNameEn = typeof dimension === 'string' ? '' : (dimension.name_en || '');

          // Create a promise to get the indicator count for this dimension
          const dimensionPromise = (async () => {
            let indicatorCount = 0;
            try {
              indicatorCount = await indicatorService.getCountByDimension(area.id, dimensionName);
            } catch (err) {
              console.warn(`Failed to get indicator count for dimension ${dimensionName}:`, err);
            }

            return {
              id: `${area.id}-${dimensionName}`, // Composite ID
              name: dimensionName,
              name_en: dimensionNameEn,
              description: `Dimensão de ${area.name}`,
              areaId: area.id,
              areaName: area.name,
              areaName_en: area.name_en || '',
              areaColor: area.color,
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
          (dim.name_en || '').toLowerCase().includes(query) ||
          dim.areaName.toLowerCase().includes(query) ||
          (dim.areaName_en || '').toLowerCase().includes(query)
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
    setEditingDimension(dimension);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (dimension) => {
    const ok = await confirmAction({
      title: t('common.confirm_title'),
      message: t('admin.dimensions.confirm_delete', { name: dimension.name }),
    });
    if (!ok) return;

    try {
      // To delete a dimension, we need to update the area
      const area = await areaService.getById(dimension.areaId);
      const dimensions = (area.dimensions || area.subdominios || [])
        .filter(sub => {
          const subName = typeof sub === 'string' ? sub : sub.name;
          return subName !== dimension.name;
        });

      await areaService.patch(dimension.areaId, {
        dimensions: dimensions
      });

      // Reload dimensions
      loadDimensions();
      setSuccessMessage(t('admin.dimensions.deleted_success', { name: dimension.name }));
    } catch (err) {
      setError(err.message || t('admin.dimensions.delete_error'));
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
    <AdminPageTemplate>
        <LoadingSkeleton />
      </AdminPageTemplate>
    );
  }

  if (error) {
    return (
    <AdminPageTemplate>
        <ErrorDisplay error={error} onRetry={loadDimensions} />
      </AdminPageTemplate>
    );
  }

  return (
    <AdminPageTemplate>

      <div className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Left Column - Dimensions Table */}
            <div className="bg-[#f1f0f0] rounded-[23px] p-8">
              <h1 className="font-['Onest',sans-serif] font-semibold text-4xl text-black mb-6">
                {t('admin.dimensions.title')}
              </h1>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 mb-4">
                <button
                  onClick={() => handleSort('name')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-left hover:text-primary flex items-center gap-1"
                >
                  {t('admin.dimensions.col_name')}
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
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">{t('admin.dimensions.col_area')}</p>
                <button
                  onClick={() => handleSort('indicatorCount')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-center hover:text-primary flex items-center justify-center gap-1"
                >
                  {t('admin.dimensions.col_indicators')}
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
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-right">{t('admin.dimensions.col_options')}</p>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {dimensions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {t('admin.dimensions.empty')}
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
                          {getName(dimension)}
                        </span>
                      </div>

                      {/* Area Badge */}
                      <div className="flex justify-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full bg-white border-2 text-xs font-medium text-center"
                          style={{ borderColor: dimension.areaColor || '#CCCCCC' }}
                        >
                          {getName({ name: dimension.areaName, name_en: dimension.areaName_en })}
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
                          title={t('common.edit')}
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(dimension)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title={t('common.delete')}
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
                    itemName={t('admin.dimensions.title').toLowerCase()}
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
                title={t('admin.dimensions.add')}
                onClick={() => setIsAddModalOpen(true)}
                className="w-[210px]"
              />

              <div className="bg-[#f1f0f0] rounded-[23px] p-6 w-[210px]">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">
                  {t('admin.dimensions.total', { count: totalItems })}
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
        onSuccess={() => { loadDimensions(); }}
      />

      {/* Edit Dimension Modal */}
      <AddDimensionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDimension(null);
        }}
        onSuccess={() => { loadDimensions(); }}
        editAreaId={editingDimension?.areaId}
        editDimensionName={editingDimension?.name}
        editDimensionNameEn={editingDimension?.name_en}
      />

      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title={t('common.success')}
        message={successMessage}
        primaryAction={{ label: t('common.continue'), onClick: () => setSuccessMessage(null) }}
      />
    </AdminPageTemplate>
  );
}
