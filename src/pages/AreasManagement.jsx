import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminPageTemplate from './AdminPageTemplate';
import ActionCard from '../components/ActionCard';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import AreaWizard from '../components/wizard/AreaWizard';
import SuccessModal from '../components/wizard/SuccessModal';
import areaService from '../services/areaService';
import indicatorService from '../services/indicatorService';
import useLocalizedName from '../hooks/useLocalizedName';
import { confirmAction } from '../utils/confirm';

export default function AreasManagement() {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [searchParams, setSearchParams] = useSearchParams();
  const [areas, setAreas] = useState([]);
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
  const [isAreaWizardOpen, setIsAreaWizardOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadAreas();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const loadAreas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all areas
      const areasData = await areaService.getAll();

      // Enhance areas with indicator counts and dimension counts
      const enhancedAreasPromises = areasData.map(async (area) => {
        const dimensionCount = (area.dimensions || area.subdominios || []).length;

        // Use the count endpoint for efficiency
        let indicatorCount = 0;
        try {
          indicatorCount = await indicatorService.getCountByArea(area.id);
        } catch (err) {
          console.warn(`Failed to get indicator count for area ${area.id}:`, err);
        }

        return {
          ...area,
          indicatorCount,
          dimensionCount
        };
      });

      const enhancedAreas = await Promise.all(enhancedAreasPromises);

      // Apply search filter
      let filteredAreas = enhancedAreas;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredAreas = enhancedAreas.filter(area =>
          area.name.toLowerCase().includes(query) ||
          (area.name_en || '').toLowerCase().includes(query)
        );
      }

      // Apply sorting
      filteredAreas.sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'indicatorCount') {
          comparison = a.indicatorCount - b.indicatorCount;
        } else if (sortBy === 'dimensionCount') {
          comparison = a.dimensionCount - b.dimensionCount;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      setTotalItems(filteredAreas.length);
      const start = currentPage * pageSize;
      const end = start + pageSize;
      const paginatedAreas = filteredAreas.slice(start, end);

      setAreas(paginatedAreas);

    } catch (err) {
      setError(err.message || t('admin.areas.load_error'));
      console.error('Error loading areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (area) => {
    setEditingAreaId(area.id);
    setIsAreaWizardOpen(true);
  };

  const handleDelete = async (area) => {
    const ok = await confirmAction({
      title: t('common.confirm_title'),
      message: t('admin.areas.confirm_delete', { name: area.name }),
    });
    if (!ok) return;

    try {
      await areaService.delete(area.id);
      loadAreas();
      setSuccessMessage(t('admin.areas.deleted_success', { name: area.name }));
    } catch (err) {
      setError(err.message || t('admin.areas.delete_error'));
      console.error('Error deleting area:', err);
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
        <ErrorDisplay error={error} onRetry={loadAreas} />
      </AdminPageTemplate>
    );
  }

  return (
    <AdminPageTemplate>

      <div className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Left Column - Areas Table */}
            <div className="bg-[#f1f0f0] rounded-[23px] p-8">
              <h1 className="font-['Onest',sans-serif] font-semibold text-4xl text-black mb-6">
                {t('admin.areas.title')}
              </h1>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 mb-4">
                <button
                  onClick={() => handleSort('name')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-left hover:text-[#009368] flex items-center gap-1"
                >
                  {t('admin.areas.col_name')}
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
                  onClick={() => handleSort('dimensionCount')}
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-center hover:text-[#009368] flex items-center justify-center gap-1"
                >
                  {t('admin.areas.col_dimensions')}
                  {sortBy === 'dimensionCount' && (
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
                  className="font-['Onest',sans-serif] font-medium text-sm text-black text-center hover:text-[#009368] flex items-center justify-center gap-1"
                >
                  {t('admin.areas.col_indicators')}
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
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-right">{t('admin.areas.col_options')}</p>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {areas.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {t('admin.areas.empty')}
                  </div>
                ) : (
                  areas.map((area) => (
                    <div
                      key={area.id}
                      className="bg-[#d9d9d9] rounded-lg p-4 grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center hover:bg-gray-300 transition-colors"
                    >
                      {/* Name with Color Badge */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: area.color || '#CCCCCC' }}
                        >
                          {area.icon ? (
                            <img src={area.icon} alt="" className="w-4 h-4" />
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          )}
                        </div>
                        <span className="font-['Onest',sans-serif] font-normal text-sm text-black">
                          {getName(area)}
                        </span>
                      </div>

                      {/* Dimension Count */}
                      <div className="flex justify-center">
                        <span className="font-['Onest',sans-serif] font-medium text-sm text-black">
                          {area.dimensionCount}
                        </span>
                      </div>

                      {/* Indicator Count */}
                      <div className="flex justify-center">
                        <span className="font-['Onest',sans-serif] font-medium text-sm text-black">
                          {area.indicatorCount}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(area)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title={t('common.edit')}
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(area)}
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
              {areas.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    hasNextPage={currentPage * pageSize + areas.length < totalItems}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showItemCount={true}
                    itemName={t('admin.areas.title').toLowerCase()}
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
                title={t('admin.areas.add')}
                onClick={() => {
                  setEditingAreaId(null);
                  setIsAreaWizardOpen(true);
                }}
                className="w-[210px]"
              />

              <div className="bg-[#f1f0f0] rounded-[23px] p-6 w-[210px]">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">
                  {t('admin.areas.total', { count: totalItems })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Area Wizard Modal */}
      <AreaWizard
        isOpen={isAreaWizardOpen}
        onClose={() => {
          setIsAreaWizardOpen(false);
          setEditingAreaId(null);
        }}
        areaId={editingAreaId}
        onSuccess={() => {
          loadAreas();
        }}
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
