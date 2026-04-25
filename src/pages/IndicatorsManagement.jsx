import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLocalizedName from '../hooks/useLocalizedName';

import indicatorService from '../services/indicatorService';
import areaService from '../services/areaService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import { confirmAction } from '../utils/confirm';
import AdminPageTemplate from './AdminPageTemplate';
import IndicatorWizard from '../components/wizard/IndicatorWizard';
import AreaWizard from '../components/wizard/AreaWizard';
import SuccessModal from '../components/wizard/SuccessModal';
import { showInfo } from '../utils/toast';
import AdminListShell, {
  AdminPageHeader,
  AdminFilterBar,
  AdminCard,
  AdminPagination,
  AdminPillButton,
  AdminPrimaryButton,
  AdminSearchInput,
  AdminSortDropdown,
  AdminSelectDropdown,
} from '../components/admin/AdminListShell';
import {
  LuFileText,
  LuPlus,
  LuCircleCheck,
  LuCircleX,
  LuSquarePen,
  LuTrash2,
} from 'react-icons/lu';

export default function IndicatorsManagement() {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedOption, setSelectedOption] = useState('indicators');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [areas, setAreas] = useState([]);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingIndicatorId, setEditingIndicatorId] = useState(null);
  const [isAreaWizardOpen, setIsAreaWizardOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Pagination state — initialized from URL so back-navigation restores the page
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '0', 10);
    return Number.isFinite(p) && p >= 0 ? p : 0;
  });
  const [pageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
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
  const [governanceFilter, setGovernanceFilter] = useState(null);
  const [areaFilter, setAreaFilter] = useState(null);
  const [dimensionFilter, setDimensionFilter] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const search = searchParams.get('q');
    if (search) {
      setSearchQuery(search);
      setIsSearchMode(true);
      setSelectedOption('indicators'); // Force to indicators view for search
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [selectedOption, currentPage, pageSize, sortBy, sortOrder, governanceFilter, areaFilter, dimensionFilter, searchQuery, isSearchMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (selectedOption === 'indicators') {
        const skip = currentPage * pageSize;
        
        if (isSearchMode && searchQuery.trim()) {
          const searchResults = await indicatorService.search(searchQuery, pageSize, skip, sortBy, sortOrder, governanceFilter, areaFilter, dimensionFilter, true);
          setIndicators(searchResults || []);

          const hasMore = searchResults && searchResults.length === pageSize;
          setHasNextPage(hasMore);
          setTotalItems(hasMore ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + (searchResults?.length || 0));
        } else if (areaFilter && dimensionFilter) {
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getByDimension(areaFilter, dimensionFilter, skip, pageSize, sortBy, sortOrder, governanceFilter, true),
            indicatorService.getCountByDimension(areaFilter, dimensionFilter, governanceFilter, true),
          ]);
          setIndicators(indicatorsData || []);
          setTotalItems(totalCount || 0);
          setHasNextPage(skip + pageSize < (totalCount || 0));
        } else if (areaFilter) {
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getByArea(areaFilter, skip, pageSize, sortBy, sortOrder, governanceFilter, true),
            indicatorService.getCountByArea(areaFilter, governanceFilter, true),
          ]);
          setIndicators(indicatorsData || []);
          setTotalItems(totalCount || 0);
          setHasNextPage(skip + pageSize < (totalCount || 0));
        } else {
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getAll(skip, pageSize, sortBy, sortOrder, governanceFilter, true),
            indicatorService.getCount(true)
          ]);

          setIndicators(indicatorsData || []);
          setTotalItems(totalCount || 0);

          const hasMore = skip + pageSize < totalCount;
          setHasNextPage(hasMore);
        }

        const areasData = await areaService.getAll(true);
        setAreas(areasData || []);
      } else {
        const areasData = await areaService.getAll();
        setAreas(areasData || []);
        setHasNextPage(false);
        setTotalItems(areasData?.length || 0);
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
      setEditingIndicatorId(id);
      setIsWizardOpen(true);
    } else {
      setEditingAreaId(id);
      setIsAreaWizardOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (selectedOption === 'indicators') {
        await indicatorService.delete(id);
        const updatedIndicators = indicators.filter(indicator => indicator.id !== id);
        setIndicators(updatedIndicators);

        if (updatedIndicators.length === 0 && currentPage > 0) {
          setCurrentPage(currentPage - 1);
        }
        loadData();
        setSuccessMessage(t('admin.indicators.deleted_success'));
      } else {
        await areaService.delete(id);
        setAreas(areas.filter(area => area.id !== id));
        setSuccessMessage(t('admin.areas.deleted_success'));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  const tableContent = selectedOption === 'indicators'
      ? indicators.map(indicator => {
        // Backend field is `domain` (either a populated Domain object or an id).
        // UI falls back to the legacy `area` field just in case.
        const rawArea = indicator.domain ?? indicator.area;
        let areaInfo = null;
        if (rawArea) {
          if (typeof rawArea === 'object') {
            areaInfo = rawArea;
          } else {
            areaInfo = areas.find(area => area.id === rawArea);
          }
        }

        return {
          ...indicator,
          name: getName(indicator),
          area: getName(areaInfo) || indicator.subdomain || indicator.dimension || 'Unknown Area',
          color: areaInfo?.color || '#CCCCCC'
        };
      })
      : areas.map(area => ({
          ...area,
          name: getName(area)
        }));

  const handleGovernanceFilter = (value) => {
    setGovernanceFilter(value);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
        <ErrorDisplay error={error} onRetry={loadData} />
      </AdminPageTemplate>
    );
  }

  return (
    <AdminPageTemplate>

      <AdminListShell>
        <AdminPageHeader
          title={t('admin.indicators.title')}
          actions={<>
            <AdminPillButton icon={LuFileText} onClick={() => showInfo(t('admin.indicators.drafts_wip'))}>
              {t('admin.indicators.view_drafts')}
            </AdminPillButton>
            <AdminPrimaryButton icon={LuPlus} onClick={() => { setEditingIndicatorId(null); setIsWizardOpen(true); }}>
              {t('admin.indicators.add')}
            </AdminPrimaryButton>
          </>}
        />

        <AdminFilterBar
          search={
            <AdminSearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchMode(e.target.value.trim().length > 0);
                setCurrentPage(0);
              }}
              placeholder={t('admin.indicators.search_placeholder', 'Pesquisar indicadores')}
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
              { value: 'name', label: t('areas.sort_name', 'Nome') },
              { value: 'periodicity', label: t('areas.sort_periodicity', 'Periodicidade') },
              { value: 'favourites', label: t('areas.sort_favorites', 'Favoritos') },
            ]}
          />
          <AdminSelectDropdown
            placeholder={t('admin.indicators.col_area')}
            value={areaFilter}
            onChange={(v) => { setAreaFilter(v); setDimensionFilter(null); setCurrentPage(0); }}
            options={areas.map(a => ({ value: a.id, label: getName(a) || a.name || '—' }))}
          />
          <AdminSelectDropdown
            placeholder={t('admin.indicators.col_dimension', 'Dimensão')}
            value={dimensionFilter}
            disabled={!areaFilter}
            onChange={(v) => { setDimensionFilter(v); setCurrentPage(0); }}
            options={(() => {
              const a = areas.find(x => x.id === areaFilter);
              const subs = a?.dimensions || a?.subdomains || a?.subdominios || [];
              return subs.map(s => {
                const name = typeof s === 'string' ? s : s.name;
                return { value: name, label: name };
              });
            })()}
          />
          <label className="inline-flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-[18px] h-[18px] rounded border-[#d4d4d4] accent-[#009368]"
              checked={governanceFilter === true}
              onChange={(e) => handleGovernanceFilter(e.target.checked ? true : null)}
            />
            <span className="font-['Onest'] text-[17px] text-[#0a0a0a]">{t('admin.indicators.col_governance')}</span>
          </label>
        </AdminFilterBar>

        <AdminCard>
          <div className="grid grid-cols-[minmax(0,2fr)_160px_160px_160px] gap-6 items-start">
            {/* Column: Nome */}
            <div className="flex flex-col gap-4">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.indicators.col_name')}
              </h2>
              {tableContent.length === 0 ? (
                <div className="py-8 text-[#737373] font-['Onest']">{t('admin.indicators.empty')}</div>
              ) : (
                tableContent.map(ind => (
                  <button
                    key={`name-${ind.id}`}
                    type="button"
                    onClick={() => navigate(`/admin/resources-management/${ind.id}`)}
                    className={`font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a] text-left hover:text-[#009368] transition-colors cursor-pointer truncate ${ind.hidden ? 'opacity-50' : ''}`}
                    title={ind.name}
                  >
                    {ind.name}
                  </button>
                ))
              )}
            </div>

            {/* Column: Dimensão */}
            <div className="flex flex-col gap-4 items-center text-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.indicators.col_dimension', 'Dimensão')}
              </h2>
              {tableContent.map(ind => (
                <span
                  key={`dim-${ind.id}`}
                  className="font-['Onest'] font-medium text-[18px] leading-6 truncate max-w-full"
                  style={{ color: ind.color || '#0a0a0a' }}
                >
                  {ind.area}
                </span>
              ))}
            </div>

            {/* Column: Governança? */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.indicators.col_governance')}?
              </h2>
              {tableContent.map(ind => (
                <div key={`gov-${ind.id}`} className="h-6 flex items-center">
                  {ind.governance ? (
                    <LuCircleCheck className="w-6 h-6 text-[#009368]" strokeWidth={1.75} />
                  ) : (
                    <LuCircleX className="w-6 h-6 text-[#dc2626]" strokeWidth={1.75} />
                  )}
                </div>
              ))}
            </div>

            {/* Column: Opções */}
            <div className="flex flex-col gap-4 items-center">
              <h2 className="font-['Onest'] font-semibold text-[24px] leading-[1.2] tracking-tight text-[#0a0a0a]">
                {t('admin.indicators.col_options')}
              </h2>
              {tableContent.map(ind => (
                <div key={`act-${ind.id}`} className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(ind.id)}
                    className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer"
                    title={t('common.edit')}
                    aria-label={t('common.edit')}
                  >
                    <LuSquarePen className="w-6 h-6" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: t('common.confirm_title'),
                        message: t('admin.indicators.confirm_delete', { name: ind.name }),
                      });
                      if (ok) handleDelete(ind.id);
                    }}
                    className="text-[#dc2626] hover:text-[#b91c1c] cursor-pointer"
                    title={t('common.delete')}
                    aria-label={t('common.delete')}
                  >
                    <LuTrash2 className="w-6 h-6" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        {tableContent.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil((totalItems || 0) / pageSize))}
            hasNextPage={hasNextPage}
            onPageChange={handlePageChange}
          />
        )}
      </AdminListShell>

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
          loadData();
        }}
      />

      {/* Area Wizard Modal */}
      <AreaWizard
        isOpen={isAreaWizardOpen}
        onClose={() => {
          setIsAreaWizardOpen(false);
          setEditingAreaId(null);
        }}
        areaId={editingAreaId}
        onSuccess={() => {
          loadData();
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