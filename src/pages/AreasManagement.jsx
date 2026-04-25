import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminPageTemplate from './AdminPageTemplate';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import AreaWizard from '../components/wizard/AreaWizard';
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

      // Fetch all areas (admin view includes hidden)
      const areasData = await areaService.getAll(true);

      // Enhance areas with indicator counts and dimension counts
      const enhancedAreasPromises = areasData.map(async (area) => {
        const dimensionCount = (area.dimensions || area.subdominios || []).length;

        // Admin view: include hidden indicators in the total
        let indicatorCount = 0;
        try {
          indicatorCount = await indicatorService.getCountByArea(area.id, null, true);
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
          comparison = ptCompare(a.name, b.name);
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

  const handleToggleHidden = async (area) => {
    try {
      await areaService.patch(area.id, { hidden: !area.hidden });
      loadAreas();
    } catch (err) {
      setError(err.message || t('admin.areas.toggle_error'));
    }
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
      <AdminListShell>
        <AdminPageHeader
          title={t('admin.areas.title')}
          actions={
            <AdminPrimaryButton
              icon={LuPlus}
              onClick={() => { setEditingAreaId(null); setIsAreaWizardOpen(true); }}
            >
              {t('admin.areas.add')}
            </AdminPrimaryButton>
          }
        />
        <AdminFilterBar
          search={
            <AdminSearchInput
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('admin.areas.search_placeholder', t('admin.indicators.search_placeholder', 'Pesquisar'))}
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
              { value: 'name', label: t('admin.areas.col_name') },
              { value: 'dimensionCount', label: t('admin.areas.col_dimensions') },
              { value: 'indicatorCount', label: t('admin.areas.col_indicators') },
            ]}
          />
        </AdminFilterBar>

        <AdminCard>
          <div className="grid grid-cols-[minmax(0,2fr)_140px_140px_160px] gap-6 items-start">
            {/* Nome */}
            <div className="flex flex-col gap-4">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.areas.col_name')}
              </h2>
              {areas.length === 0 ? (
                <div className="py-8 text-[#737373] font-['Onest']">{t('admin.areas.empty')}</div>
              ) : (
                areas.map(a => (
                  <div key={`name-${a.id}`} className={`flex items-center gap-3 ${a.hidden ? 'opacity-50' : ''}`}>
                    <span
                      className="w-6 h-6 rounded-full shrink-0 border border-black/5"
                      style={{ backgroundColor: a.color || '#CCCCCC' }}
                    />
                    <span className="font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a] truncate">
                      {getName(a)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {/* Dimensões */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.areas.col_dimensions')}
              </h2>
              {areas.map(a => (
                <span key={`dim-${a.id}`} className="font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a]">{a.dimensionCount}</span>
              ))}
            </div>
            {/* Indicadores */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.areas.col_indicators')}
              </h2>
              {areas.map(a => (
                <span key={`ind-${a.id}`} className="font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a]">{a.indicatorCount}</span>
              ))}
            </div>
            {/* Opções */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.areas.col_options')}
              </h2>
              {areas.map(a => (
                <div key={`act-${a.id}`} className="flex items-center gap-4">
                  <button type="button" onClick={() => handleToggleHidden(a)} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" title={a.hidden ? t('admin.areas.show', 'Mostrar') : t('admin.areas.hide', 'Esconder')}>
                    {a.hidden ? <LuEyeOff className="w-6 h-6" strokeWidth={1.75} /> : <LuEye className="w-6 h-6" strokeWidth={1.75} />}
                  </button>
                  <button type="button" onClick={() => handleEdit(a)} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" title={t('common.edit')}>
                    <LuSquarePen className="w-6 h-6" strokeWidth={1.75} />
                  </button>
                  <button type="button" onClick={() => handleDelete(a)} className="text-[#dc2626] hover:text-[#b91c1c] cursor-pointer" title={t('common.delete')}>
                    <LuTrash2 className="w-6 h-6" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        {areas.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil((totalItems || 0) / pageSize))}
            hasNextPage={currentPage * pageSize + areas.length < totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </AdminListShell>

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
