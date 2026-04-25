import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminPageTemplate from './AdminPageTemplate';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import AddDimensionModal from '../components/wizard/AddDimensionModal';
import SuccessModal from '../components/wizard/SuccessModal';
import areaService from '../services/areaService';
import indicatorService from '../services/indicatorService';
import useLocalizedName from '../hooks/useLocalizedName';
import { confirmAction } from '../utils/confirm';
import { ptCompare } from '../utils/sort';
import AdminListShell, {
  AdminPageHeader,
  AdminFilterBar,
  AdminCard,
  AdminPagination,
  AdminPrimaryButton,
  AdminSearchInput,
  AdminSortDropdown,
} from '../components/admin/AdminListShell';
import {
  LuPlus,
  LuSquarePen,
  LuTrash2,
  LuEye,
  LuEyeOff,
} from 'react-icons/lu';

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

      // Fetch all areas (admin view includes hidden)
      const areas = await areaService.getAll(true);

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
              indicatorCount = await indicatorService.getCountByDimension(area.id, dimensionName, null, true);
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
              hidden: typeof dimension === 'object' ? !!dimension.hidden : false,
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
          comparison = ptCompare(a.name, b.name);
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

  const handleToggleHidden = async (dimension) => {
    try {
      const area = await areaService.getById(dimension.areaId);
      const current = area.subdomains || area.dimensions || area.subdominios || [];
      const next = current.map(sub => {
        const subObj = typeof sub === 'string' ? { name: sub } : sub;
        if (subObj.name === dimension.name) {
          return { ...subObj, hidden: !subObj.hidden };
        }
        return subObj;
      });
      await areaService.patch(dimension.areaId, { subdomains: next });
      loadDimensions();
    } catch (err) {
      setError(err.message || t('admin.dimensions.toggle_error'));
    }
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
      const remaining = (area.subdomains || area.dimensions || area.subdominios || [])
        .filter(sub => {
          const subName = typeof sub === 'string' ? sub : sub.name;
          return subName !== dimension.name;
        });

      // Backend field is `subdomains` — using `dimensions` makes the PATCH
      // a no-op (pydantic drops the unknown field silently).
      await areaService.patch(dimension.areaId, {
        subdomains: remaining
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
      <AdminListShell>
        <AdminPageHeader
          title={t('admin.dimensions.title')}
          actions={
            <AdminPrimaryButton icon={LuPlus} onClick={() => setIsAddModalOpen(true)}>
              {t('admin.dimensions.add')}
            </AdminPrimaryButton>
          }
        />

        <AdminFilterBar
          search={
            <AdminSearchInput
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('admin.dimensions.search_placeholder', t('admin.indicators.search_placeholder', 'Pesquisar'))}
            />
          }
        >
          <AdminSortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChange={(nextBy, nextOrder) => {
              setSortBy(nextBy);
              setSortOrder(nextOrder);
              setCurrentPage(0);
            }}
            options={[
              { value: 'name', label: t('admin.dimensions.col_name') },
              { value: 'indicatorCount', label: t('admin.dimensions.col_indicators') },
            ]}
          />
        </AdminFilterBar>

        <AdminCard>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_160px_160px] gap-6 items-start">
            {/* Nome */}
            <div className="flex flex-col gap-4">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.dimensions.col_name')}
              </h2>
              {dimensions.length === 0 ? (
                <div className="py-8 text-[#737373] font-['Onest']">{t('admin.dimensions.empty')}</div>
              ) : (
                dimensions.map(dim => (
                  <span
                    key={`name-${dim.id}`}
                    className={`font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a] truncate ${dim.hidden ? 'opacity-50' : ''}`}
                    title={getName(dim)}
                  >
                    {getName(dim)}
                  </span>
                ))
              )}
            </div>

            {/* Área */}
            <div className="flex flex-col gap-4">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.dimensions.col_area')}
              </h2>
              {dimensions.map(dim => (
                <span
                  key={`area-${dim.id}`}
                  className="font-['Onest'] font-medium text-[18px] leading-6 truncate"
                  style={{ color: dim.areaColor || '#0a0a0a' }}
                >
                  {getName({ name: dim.areaName, name_en: dim.areaName_en })}
                </span>
              ))}
            </div>

            {/* Indicadores */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.dimensions.col_indicators')}
              </h2>
              {dimensions.map(dim => (
                <span key={`count-${dim.id}`} className="font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a]">
                  {dim.indicatorCount}
                </span>
              ))}
            </div>

            {/* Opções */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.dimensions.col_options')}
              </h2>
              {dimensions.map(dim => {
                const showLabel = dim.hidden ? t('admin.dimensions.show', 'Mostrar') : t('admin.dimensions.hide', 'Esconder');
                return (
                  <div key={`act-${dim.id}`} className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleHidden(dim)}
                      className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer"
                      title={showLabel}
                      aria-label={showLabel}
                      aria-pressed={!dim.hidden}
                    >
                      {dim.hidden
                        ? <LuEyeOff className="w-6 h-6" strokeWidth={1.75} />
                        : <LuEye className="w-6 h-6" strokeWidth={1.75} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(dim)}
                      className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer"
                      title={t('common.edit')}
                      aria-label={t('common.edit')}
                    >
                      <LuSquarePen className="w-6 h-6" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dim)}
                      className="text-[#dc2626] hover:text-[#b91c1c] cursor-pointer"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                    >
                      <LuTrash2 className="w-6 h-6" strokeWidth={1.75} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </AdminCard>

        {dimensions.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil((totalItems || 0) / pageSize))}
            hasNextPage={currentPage * pageSize + dimensions.length < totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </AdminListShell>

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
