import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import indicatorService from '../../services/indicatorService';
import useLocalizedName from '../../hooks/useLocalizedName';

/**
 * IndicatorPicker — search + multi-select for existing indicators.
 *
 * Used by ResourceWizard when the user picks "INDICATOR" as the source type
 * for a composed indicator. The picker keeps a list of selected indicators
 * (full objects, not just IDs) so the parent can render names without an
 * extra fetch.
 *
 * `excludeId` and `excludeIds` are filtered out of the result list so the
 * user can't pick themselves or already-included children.
 */
export default function IndicatorPicker({
  excludeId = null,
  excludeIds = [],
  selected = [],
  onChange,
  error = null,
}) {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const debounceRef = useRef(null);
  // Sequence number for the in-flight search request. Only the most recent
  // request is allowed to update state — protects against rapid typing
  // resolving in the wrong order, and against late responses landing after
  // unmount.
  const requestSeqRef = useRef(0);

  const excludeSet = useMemo(() => {
    const s = new Set(excludeIds || []);
    if (excludeId) s.add(excludeId);
    return s;
  }, [excludeId, excludeIds]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = (query || '').trim();
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      const mySeq = ++requestSeqRef.current;
      try {
        setLoading(true);
        setFetchError(null);
        // Empty query: list a default page so the picker isn't empty on first
        // open. Search uses the dedicated search endpoint with relevance.
        const data = trimmed.length >= 2
          ? await indicatorService.search(trimmed, 25, 0, 'relevance')
          : await indicatorService.getAll(0, 25, 'name', 'asc');
        // Drop responses superseded by a later request, or those that come
        // back after the effect has been cleaned up (cleanup ran).
        if (cancelled || mySeq !== requestSeqRef.current) return;
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled || mySeq !== requestSeqRef.current) return;
        console.error('Indicator picker search failed:', err);
        setFetchError(err?.userMessage || err?.message || 'Erro ao pesquisar.');
        setResults([]);
      } finally {
        if (!cancelled && mySeq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    }, trimmed.length >= 2 ? 200 : 0);
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isSelected = (id) => (selected || []).some((i) => i.id === id);

  const toggle = (ind) => {
    const id = ind.id;
    if (!id) return;
    if (isSelected(id)) {
      onChange((selected || []).filter((i) => i.id !== id));
    } else {
      const compact = {
        id,
        // Keep both names so renderers can pick the right one for the
        // current language without re-fetching.
        name: ind.name,
        name_en: ind.name_en,
        subdomain: ind.subdomain,
        // domain in search results is an object; in /list it may be ObjectId
        domain_name: ind?.domain?.name || null,
      };
      onChange([...(selected || []), compact]);
    }
  };

  const visibleResults = useMemo(
    () => (results || []).filter((r) => r?.id && !excludeSet.has(r.id)),
    [results, excludeSet],
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('wizard.resource.indicator_search', 'Pesquisar indicadores…')}
        className="input input-bordered w-full"
      />

      {(selected || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((ind) => (
            <span
              key={ind.id}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/30 rounded-full px-3 py-1 text-sm"
            >
              {getName(ind)}
              <button
                type="button"
                onClick={() => toggle(ind)}
                className="ml-1 hover:opacity-70"
                aria-label={t('common.remove', 'Remover')}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {fetchError && (
        <div className="text-sm text-red-600">{fetchError}</div>
      )}

      <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-sm text-gray-500">
            {t('wizard.resource.indicator_loading', 'A carregar…')}
          </div>
        )}
        {!loading && visibleResults.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            {query.trim().length >= 2
              ? t('wizard.resource.indicator_no_results', 'Sem resultados.')
              : t('wizard.resource.indicator_search_hint', 'Comece a escrever para procurar.')}
          </div>
        )}
        {!loading && visibleResults.map((r) => {
          const checked = isSelected(r.id);
          return (
            <button
              type="button"
              key={r.id}
              onClick={() => toggle(r)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                checked ? 'bg-primary/5' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm mt-0.5"
                checked={checked}
                readOnly
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-black truncate">
                  {getName(r) || r.id}
                </div>
                {(r?.domain?.name || r.subdomain) && (
                  <div className="text-xs text-gray-500 truncate">
                    {[r?.domain?.name, r.subdomain].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

IndicatorPicker.propTypes = {
  excludeId: PropTypes.string,
  excludeIds: PropTypes.arrayOf(PropTypes.string),
  selected: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
