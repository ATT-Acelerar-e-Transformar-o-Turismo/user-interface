import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLocalizedName from '../hooks/useLocalizedName';
import useDebouncedValue from '../hooks/useDebouncedValue';

import indicatorService from '../services/indicatorService';
import resourceService from '../services/resourceService';
import areaService from '../services/areaService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import { confirmAction } from '../utils/confirm';
import AdminPageTemplate from './AdminPageTemplate';
import IndicatorFormPanel from '../components/admin/IndicatorFormPanel';
import IndicatorDetailPanel from '../components/admin/IndicatorDetailPanel';
import AreaFormPanel from '../components/admin/AreaFormPanel';
import SuccessModal from '../components/wizard/SuccessModal';
import IndicatorDashboardStats from '../components/admin/IndicatorDashboardStats';
import SourcePill from '../components/admin/SourcePill';
import { sourceFromType } from '../utils/resourceSource';
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
  LuEye,
  LuEyeOff,
} from 'react-icons/lu';

export default function IndicatorsManagement() {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedOption, setSelectedOption] = useState('indicators');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Flips true after the first loadData completes so subsequent loads
  // (triggered by typing in the search box, filter changes, etc.) don't
  // tear down the page into a skeleton — the input stays mounted and
  // the user keeps focus.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [areas, setAreas] = useState([]);
  // Per-indicator data-source ('api' | 'upload' | null), derived from each
  // indicator's attached resources. Populated asynchronously after the table
  // loads so the page paints without waiting on the extra resource fetches.
  const [sourceMap, setSourceMap] = useState({});

  // Right-half indicator panels (create/edit form + visualization), shown
  // over the list instead of a modal / separate page.
  const [formPanel, setFormPanel] = useState({ open: false, id: null });
  const [detailPanel, setDetailPanel] = useState({ open: false, indicator: null, source: null });
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
  // Drafts pill toggle. Off → backend hides drafts (default). On → backend
  // returns ONLY drafts so the admin can find and finish them.
  const [draftsOnly, setDraftsOnly] = useState(false);

  // Search state. `searchInput` is the controlled value bound to the input
  // element so typing stays responsive; `searchQuery` is the debounced value
  // that drives loadData so we don't fire an API call (and unmount the page
  // into a skeleton) on every keystroke.
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedValue(searchInput, 300);
  const isSearchMode = searchQuery.trim().length > 0;

  useEffect(() => {
    const search = searchParams.get('q');
    if (search) {
      setSearchInput(search);
      setSelectedOption('indicators'); // Force to indicators view for search
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [selectedOption, currentPage, pageSize, sortBy, sortOrder, governanceFilter, areaFilter, dimensionFilter, searchQuery, isSearchMode, draftsOnly]);

  // Derive the data-source pill for each visible indicator. The reliable
  // signal is the wrapper's source_type ('API' vs 'CSV'/'XLSX'), so for each
  // indicator we look at its resources' wrappers. Best-effort + non-blocking:
  // a row shows "—" until its source resolves; 'api' wins if any resource is API.
  useEffect(() => {
    if (selectedOption !== 'indicators' || indicators.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(indicators.map(async (ind) => {
        try {
          const ids = Array.isArray(ind.resources) ? ind.resources : (await indicatorService.getResources(ind.id));
          const list = Array.isArray(ids) ? ids : [];
          let result = null;
          for (const item of list) {
            const r = typeof item === 'string' ? await resourceService.getById(item).catch(() => null) : item;
            if (!r) continue;
            let st = null;
            if (r.wrapper_id) {
              try { const w = await resourceService.getWrapper(r.wrapper_id); st = w?.source_type; } catch { /* ignore */ }
            }
            const s = sourceFromType(st) || sourceFromType(r.type);
            if (s === 'api') { result = 'api'; break; }
            if (s) result = s;
          }
          return [ind.id, result];
        } catch {
          return [ind.id, null];
        }
      }));
      if (!cancelled) setSourceMap(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [indicators, selectedOption]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (selectedOption === 'indicators') {
        const skip = currentPage * pageSize;
        // `null` lets the backend default kick in (hide drafts); `'draft'` flips
        // the listing to drafts-only when the "Rascunhos" pill is active.
        const statusFilter = draftsOnly ? 'draft' : null;

        if (isSearchMode && searchQuery.trim()) {
          const searchResults = await indicatorService.search(searchQuery, pageSize, skip, sortBy, sortOrder, governanceFilter, areaFilter, dimensionFilter, true, statusFilter);
          setIndicators(searchResults || []);

          const hasMore = searchResults && searchResults.length === pageSize;
          setHasNextPage(hasMore);
          setTotalItems(hasMore ? (currentPage + 1) * pageSize + 1 : (currentPage * pageSize) + (searchResults?.length || 0));
        } else if (areaFilter && dimensionFilter) {
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getByDimension(areaFilter, dimensionFilter, skip, pageSize, sortBy, sortOrder, governanceFilter, true, statusFilter),
            indicatorService.getCountByDimension(areaFilter, dimensionFilter, governanceFilter, true, statusFilter),
          ]);
          setIndicators(indicatorsData || []);
          setTotalItems(totalCount || 0);
          setHasNextPage(skip + pageSize < (totalCount || 0));
        } else if (areaFilter) {
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getByArea(areaFilter, skip, pageSize, sortBy, sortOrder, governanceFilter, true, statusFilter),
            indicatorService.getCountByArea(areaFilter, governanceFilter, true, statusFilter),
          ]);
          setIndicators(indicatorsData || []);
          setTotalItems(totalCount || 0);
          setHasNextPage(skip + pageSize < (totalCount || 0));
        } else {
          const [indicatorsData, totalCount] = await Promise.all([
            indicatorService.getAll(skip, pageSize, sortBy, sortOrder, governanceFilter, true, statusFilter),
            indicatorService.getCount(true, statusFilter)
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
      setHasLoadedOnce(true);
    }
  };

  const handleEdit = (id) => {
    if (!id || id === 'undefined') {
      setError('Invalid item ID. Cannot edit.');
      return;
    }

    if (selectedOption === 'indicators') {
      setDetailPanel({ open: false, indicator: null, source: null });
      setFormPanel({ open: true, id });
    } else {
      setEditingAreaId(id);
      setIsAreaWizardOpen(true);
    }
  };

  const handleToggleHidden = async (id, currentHidden) => {
    try {
      await indicatorService.patch(id, { hidden: !currentHidden });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to toggle visibility');
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
          area: getName(areaInfo) || 'Unknown Area',
          dimension: indicator.subdomain || indicator.dimension || '',
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

  if (loading && !hasLoadedOnce) {
    return (
    <AdminPageTemplate>
        <LoadingSkeleton />
      </AdminPageTemplate>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={loadData} />;
  }

  return (
    <AdminPageTemplate bgClassName="bg-[#f3f4f6]">

      <AdminListShell>
        {selectedOption === 'indicators' && (
          <IndicatorDashboardStats areas={areas} />
        )}

        <AdminPageHeader
          title={t('admin.indicators.title')}
          actions={<>
            <AdminPillButton
              icon={LuFileText}
              onClick={() => {
                // Toggle drafts-only listing. Reset paging so the user lands on
                // page 1 of the new view instead of an empty later page.
                setCurrentPage(0);
                setDraftsOnly(v => !v);
              }}
              aria-pressed={draftsOnly}
              className={draftsOnly ? 'bg-[#0a0a0a] text-[#fffefc]' : undefined}
            >
              {draftsOnly
                ? t('admin.indicators.view_all', 'Ver todos')
                : t('admin.indicators.view_drafts')}
            </AdminPillButton>
            <AdminPrimaryButton icon={LuPlus} onClick={() => setFormPanel({ open: true, id: null })}>
              {t('admin.indicators.add')}
            </AdminPrimaryButton>
          </>}
        />

        <AdminFilterBar
          search={
            <AdminSearchInput
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
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
            options={areas.map(a => ({ value: a.id, label: getName(a) || a.name || '—', color: a.color }))}
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
          {/* Header row */}
          <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-6 items-center pb-4 border-b border-[#e5e5e5]">
            <h2 className="font-['Onest'] font-semibold text-[20px] leading-6 text-[#0a0a0a]">{t('admin.indicators.col_name')}</h2>
            <h2 className="font-['Onest'] font-semibold text-[20px] leading-6 text-[#0a0a0a]">{t('admin.indicators.col_dimension', 'Dimensão')}</h2>
            <h2 className="font-['Onest'] font-semibold text-[20px] leading-6 text-[#0a0a0a]">{t('admin.indicators.col_area', 'Área')}</h2>
            <h2 className="font-['Onest'] font-semibold text-[20px] leading-6 text-[#0a0a0a]">{t('admin.indicators.col_governance')}?</h2>
            <h2 className="font-['Onest'] font-semibold text-[20px] leading-6 text-[#0a0a0a]">{t('admin.indicators.col_source', 'Fonte')}</h2>
            <h2 className="font-['Onest'] font-semibold text-[20px] leading-6 text-[#0a0a0a]">{t('admin.indicators.col_options')}</h2>
          </div>

          {tableContent.length === 0 ? (
            <div className="py-8 text-[#737373] font-['Onest']">{t('admin.indicators.empty')}</div>
          ) : (
            tableContent.map(ind => {
              const showLabel = ind.hidden ? t('admin.indicators.show', 'Mostrar') : t('admin.indicators.hide', 'Esconder');
              return (
                <div
                  key={ind.id}
                  className={`grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-6 items-center py-4 border-b border-[#e5e5e5] last:border-0 ${ind.hidden ? 'opacity-50' : ''}`}
                >
                  {/* Nome */}
                  <button
                    type="button"
                    onClick={() => setDetailPanel({ open: true, indicator: ind, source: sourceMap[ind.id] ?? null })}
                    className="flex flex-col gap-1 text-left hover:text-[#009368] transition-colors cursor-pointer group min-w-0"
                    title={ind.name}
                  >
                    <span className="font-['Onest'] font-medium text-[18px] leading-[1.4] text-[#0a0a0a] group-hover:text-[#009368] line-clamp-2">
                      {ind.name}
                    </span>
                    {ind.unit && (
                      <span className="font-['Onest'] text-[14px] leading-[21px] tracking-[0.07px] text-[#0a0a0a]/70 truncate">
                        {ind.unit}
                      </span>
                    )}
                  </button>

                  {/* Dimensão */}
                  <span className="font-['Onest'] font-medium text-[18px] leading-6 text-[#0a0a0a] truncate">
                    {ind.dimension || '—'}
                  </span>

                  {/* Área */}
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center rounded-[22px] px-3 py-1.5 font-['Onest'] font-medium text-[14px] leading-[21px] tracking-[0.07px] text-[#fffefc] truncate max-w-full"
                      style={{ backgroundColor: ind.color || '#737373' }}
                    >
                      {ind.area}
                    </span>
                  </div>

                  {/* Governança? */}
                  <div>
                    {ind.governance ? (
                      <LuCircleCheck className="w-7 h-7 text-[#009368]" strokeWidth={1.75} />
                    ) : (
                      <LuCircleX className="w-7 h-7 text-[#dc2626]" strokeWidth={1.75} />
                    )}
                  </div>

                  {/* Fonte */}
                  <div><SourcePill source={sourceMap[ind.id]} /></div>

                  {/* Opções */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleHidden(ind.id, ind.hidden)}
                      className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer"
                      title={showLabel}
                      aria-label={showLabel}
                      aria-pressed={!ind.hidden}
                    >
                      {ind.hidden ? <LuEyeOff className="w-6 h-6" strokeWidth={1.75} /> : <LuEye className="w-6 h-6" strokeWidth={1.75} />}
                    </button>
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
                </div>
              );
            })
          )}
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

      {/* Indicator detail (visualization) — right-half panel */}
      {detailPanel.open && (
        <IndicatorDetailPanel
          indicator={detailPanel.indicator}
          source={detailPanel.source}
          onClose={() => setDetailPanel({ open: false, indicator: null, source: null })}
          onEdit={(id) => {
            setDetailPanel({ open: false, indicator: null, source: null });
            setFormPanel({ open: true, id });
          }}
        />
      )}

      {/* Indicator create/edit — right-half panel */}
      {formPanel.open && (
        <IndicatorFormPanel
          indicatorId={formPanel.id}
          onClose={() => setFormPanel({ open: false, id: null })}
          onSaved={() => loadData()}
        />
      )}

      {/* Area create/edit — right-half panel */}
      {isAreaWizardOpen && (
        <AreaFormPanel
          areaId={editingAreaId}
          onClose={() => {
            setIsAreaWizardOpen(false);
            setEditingAreaId(null);
          }}
          onSaved={() => loadData()}
        />
      )}

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