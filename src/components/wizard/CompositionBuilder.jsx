import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import indicatorService from '../../services/indicatorService';
import useLocalizedName from '../../hooks/useLocalizedName';

/**
 * CompositionBuilder — lets the admin define a derived series from exactly
 * two existing indicators (variables `a` and `b`) plus a free-form arithmetic
 * formula. The two-input shape is enforced both here and by the backend
 * schema; the formula evaluator itself supports more, but the UI does not
 * expose that.
 *
 * Shape of `value`:
 *   { inputs: [{ key, indicator_id, indicator }, { key, indicator_id, indicator }],
 *     formula, bucket, aggregator, name }
 *
 * `indicator` is the full picker row (for display); the backend only
 * receives { key, indicator_id }.
 */
export default function CompositionBuilder({ value, onChange, excludeId, errors = {} }) {
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const [allIndicators, setAllIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const data = await indicatorService.getAll(0, 500, 'name', 'asc');
        setAllIndicators(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load indicators for composition:', err);
        setFetchError(err?.userMessage || err?.message || 'Erro ao carregar indicadores.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleIndicators = useMemo(
    () => allIndicators.filter((i) => i?.id && i.id !== excludeId),
    [allIndicators, excludeId],
  );

  // Composed indicators are fixed at exactly two inputs: `a` and `b`. The
  // formula combines them (e.g. `a / b`). We normalize incoming `value` to
  // guarantee two slots so the UI always renders both rows.
  const FIXED_KEYS = ['a', 'b'];
  const rawInputs = value?.inputs || [];
  const inputs = FIXED_KEYS.map((k, i) => {
    const existing = rawInputs.find((r) => r?.key === k) || rawInputs[i];
    return {
      key: k,
      indicator_id: existing?.indicator_id || '',
      indicator: existing?.indicator || null,
    };
  });
  const formula = value?.formula || '';
  const bucket = value?.bucket || '1M';
  const aggregator = value?.aggregator || 'avg';
  const name = value?.name || '';

  const update = (patch) => onChange({ ...value, ...patch });

  useEffect(() => {
    // Persist the normalized two-slot shape so consumers (wizard submit /
    // review step) always see exactly two entries.
    const same =
      rawInputs.length === 2 &&
      rawInputs.every((r, i) => r?.key === FIXED_KEYS[i]);
    if (!same) update({ inputs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setInputIndicator = (idx, ind) => {
    const next = inputs.map((row, i) =>
      i === idx ? { ...row, indicator_id: ind.id, indicator: ind } : row,
    );
    update({ inputs: next });
  };

  return (
    <div className="space-y-5">
      {/* Optional display name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('wizard.composition.name_label', 'Nome (opcional)')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder={t('wizard.composition.name_placeholder', 'e.g. Taxa de ocupação')}
          className="input input-bordered w-full"
        />
      </div>

      {/* Inputs list */}
      <div>
        <div className="mb-2">
          <label className="block text-sm font-medium">
            {t('wizard.composition.inputs_label', 'Indicadores fonte')}
          </label>
        </div>

        {fetchError && <div className="text-sm text-red-600 mb-2">{fetchError}</div>}
        {errors.inputs && <div className="text-sm text-red-600 mb-2">{errors.inputs}</div>}

        <div className="space-y-2">
          {inputs.map((row, idx) => (
            <div
              key={row.key}
              className="flex flex-col sm:flex-row gap-2 sm:items-center p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {t('wizard.composition.key_label', 'Variável')}
                </span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-gray-100 font-mono text-sm">
                  {row.key}
                </span>
              </div>
              <select
                value={row.indicator_id || ''}
                onChange={(e) => {
                  const ind = visibleIndicators.find((i) => i.id === e.target.value);
                  if (ind) setInputIndicator(idx, ind);
                }}
                className="select select-bordered select-sm flex-1 min-w-0"
                disabled={loading}
              >
                <option value="">
                  {loading
                    ? t('wizard.composition.loading', 'A carregar…')
                    : t('wizard.composition.choose_indicator', 'Escolher indicador…')}
                </option>
                {visibleIndicators.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {getName(ind) || ind.id}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Formula */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('wizard.composition.formula_label', 'Fórmula')}
        </label>
        <input
          type="text"
          value={formula}
          onChange={(e) => update({ formula: e.target.value })}
          placeholder={t('wizard.composition.formula_placeholder', 'e.g. a / b')}
          className="input input-bordered w-full font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t(
            'wizard.composition.formula_help',
            'Use as variáveis acima (+ - * / ( ) e funções min, max, abs, log, sqrt).',
          )}
        </p>
        {errors.formula && <div className="text-sm text-red-600 mt-1">{errors.formula}</div>}
      </div>

      {/* Bucket + aggregator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('wizard.composition.bucket_label', 'Granularidade')}
          </label>
          <select
            value={bucket}
            onChange={(e) => update({ bucket: e.target.value })}
            className="select select-bordered w-full"
          >
            <option value="1d">{t('wizard.composition.bucket_day', 'Dia')}</option>
            <option value="1w">{t('wizard.composition.bucket_week', 'Semana')}</option>
            <option value="1M">{t('wizard.composition.bucket_month', 'Mês')}</option>
            <option value="3M">{t('wizard.composition.bucket_quarter', 'Trimestre')}</option>
            <option value="1y">{t('wizard.composition.bucket_year', 'Ano')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('wizard.composition.aggregator_label', 'Agregação por bucket')}
          </label>
          <select
            value={aggregator}
            onChange={(e) => update({ aggregator: e.target.value })}
            className="select select-bordered w-full"
          >
            <option value="avg">{t('wizard.composition.agg_avg', 'Média')}</option>
            <option value="sum">{t('wizard.composition.agg_sum', 'Soma')}</option>
            <option value="min">{t('wizard.composition.agg_min', 'Mínimo')}</option>
            <option value="max">{t('wizard.composition.agg_max', 'Máximo')}</option>
            <option value="last">{t('wizard.composition.agg_last', 'Último')}</option>
            <option value="first">{t('wizard.composition.agg_first', 'Primeiro')}</option>
            <option value="median">{t('wizard.composition.agg_median', 'Mediana')}</option>
            <option value="count">{t('wizard.composition.agg_count', 'Contagem')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

CompositionBuilder.propTypes = {
  value: PropTypes.shape({
    inputs: PropTypes.array,
    formula: PropTypes.string,
    bucket: PropTypes.string,
    aggregator: PropTypes.string,
    name: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  excludeId: PropTypes.string,
  errors: PropTypes.object,
};
