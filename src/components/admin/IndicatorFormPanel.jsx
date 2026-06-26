import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { LuX, LuFileText } from 'react-icons/lu';
import FormInput from '../forms/FormInput';
import FormTextarea from '../forms/FormTextarea';
import FormSelect from '../forms/FormSelect';
import FormCheckbox from '../forms/FormCheckbox';
import SuccessModal from '../wizard/SuccessModal';
import ChartTypeOption from './ChartTypeOption';
import useSlideOver from '../../hooks/useSlideOver';
import indicatorService from '../../services/indicatorService';
import areaService from '../../services/areaService';
import { CHART_TYPES, CHART_TYPE_LABEL_KEYS, DEFAULT_CHART_TYPES, DEFAULT_CHART_TYPE } from '../../constants/chartTypes';

// Right-half create/edit panel for an indicator (Figma nodes 2871:12370 /
// 2898:16176). Renders over the indicators list, occupying ~half the screen.
const EMPTY = {
  name: '', name_en: '', description: '', description_en: '',
  area: '', dimension: '', unit: '', unit_en: '',
  scale: '', scale_en: '', font: '', font_en: '', governance: false,
  carrying_capacity_enabled: false, carrying_capacity: '',
  show_time_averages: true,
  chart_types: [...DEFAULT_CHART_TYPES], default_chart_type: DEFAULT_CHART_TYPE,
  status: 'published',
};

export default function IndicatorFormPanel({ indicatorId = null, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!indicatorId;

  const [data, setData] = useState(EMPTY);
  const [areas, setAreas] = useState([]);
  const [lang, setLang] = useState('pt');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(false);
  const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const areasData = await areaService.getAll();
        if (!cancelled) setAreas(areasData || []);
        if (isEdit) {
          const ind = await indicatorService.getById(indicatorId);
          if (!cancelled && ind) {
            setData({
              name: ind.name || '', name_en: ind.name_en || '',
              description: ind.description || '', description_en: ind.description_en || '',
              area: ind.domain?.id || ind.domain || ind.area?.id || ind.area || '',
              dimension: ind.subdomain || ind.dimension || '',
              unit: ind.unit || '', unit_en: ind.unit_en || '',
              scale: ind.scale || '', scale_en: ind.scale_en || '',
              font: ind.font || '', font_en: ind.font_en || '',
              governance: ind.governance || false,
              carrying_capacity_enabled: ind.carrying_capacity != null && ind.carrying_capacity !== '',
              carrying_capacity: ind.carrying_capacity ?? '',
              show_time_averages: ind.show_time_averages !== false,
              chart_types: Array.isArray(ind.chart_types) && ind.chart_types.length > 0
                ? ind.chart_types : [...DEFAULT_CHART_TYPES],
              default_chart_type: ind.default_chart_type || DEFAULT_CHART_TYPE,
              status: ind.status || 'published',
            });
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.userMessage || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [indicatorId, isEdit]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [requestClose]);

  const set = (key) => (value) => setData(prev => ({ ...prev, [key]: value }));

  // Toggle a chart type in/out of the allowed set, keeping default_chart_type
  // consistent: if the current default gets removed, fall back to the first
  // remaining type; if nothing was selected as default yet, adopt the first.
  const toggleChartType = (type) => {
    setData(prev => {
      const current = prev.chart_types || [];
      const has = current.includes(type);
      const next = has ? current.filter(t => t !== type) : [...current, type];
      let def = prev.default_chart_type;
      if (has && def === type) def = next[0] || '';
      else if (!def && next.length > 0) def = next[0];
      return { ...prev, chart_types: next, default_chart_type: def };
    });
  };

  const selectedArea = areas.find(a => a.id === data.area);
  const dimensionOptions = (() => {
    const subs = selectedArea?.dimensions || selectedArea?.subdomains || selectedArea?.subdominios || [];
    return subs.map(s => { const name = typeof s === 'string' ? s : s.name; return { value: name, label: name }; });
  })();

  const validate = () => {
    const e = {};
    if (!data.name.trim()) e.name = t('validation.required', { field: t('wizard.indicator.name_pt', 'Nome'), defaultValue: 'Campo obrigatório' });
    if (!data.area) e.area = t('validation.required', { field: t('wizard.indicator.area', 'Área'), defaultValue: 'Campo obrigatório' });
    if (!data.dimension) e.dimension = t('validation.required', { field: t('wizard.indicator.dimension', 'Dimensão'), defaultValue: 'Campo obrigatório' });
    if (!data.chart_types || data.chart_types.length === 0) {
      e.chart_types = t('wizard.indicator.chart_types_required', 'Selecione pelo menos um tipo de gráfico');
    } else if (!data.chart_types.includes(data.default_chart_type)) {
      e.default_chart_type = t('wizard.indicator.default_chart_type_invalid', 'O gráfico predefinido tem de estar entre os selecionados');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async ({ asDraft = false, publish = false } = {}) => {
    if (!validate()) return;
    const payload = {
      name: data.name.trim(), name_en: data.name_en.trim(),
      description: data.description.trim(), description_en: data.description_en.trim(),
      unit: data.unit.trim(), unit_en: data.unit_en.trim(),
      scale: data.scale.trim(), scale_en: data.scale_en.trim(),
      font: data.font.trim(), font_en: data.font_en.trim(),
      governance: data.governance,
      carrying_capacity: data.carrying_capacity_enabled && data.carrying_capacity !== ''
        ? Number(data.carrying_capacity)
        : null,
      show_time_averages: data.show_time_averages,
      chart_types: data.chart_types,
      default_chart_type: data.default_chart_type,
    };
    try {
      setSaving(true);
      setError(null);
      let saved;
      if (isEdit) {
        // Use PATCH for the edit panel — it only touches a subset of fields
        // (no periodicity input), and PUT's schema requires the full body
        // including `periodicity` and `favourites`, which we don't send.
        // When publishing a draft, also flip its status so the indicator
        // shows up in public listings.
        saved = await indicatorService.patch(indicatorId, {
          ...payload,
          domain: data.area,
          subdomain: data.dimension,
          ...(publish ? { status: 'published' } : {}),
        });
      } else {
        saved = await indicatorService.create(data.area, data.dimension, {
          ...payload,
          favourites: 0,
          hidden_series: [],
          series_translations: {},
          // Draft vs published lifecycle. Drafts skip the public listings
          // and stay editable until the admin clicks "Adicionar indicador",
          // which sends status="published".
          status: asDraft ? 'draft' : 'published',
        });
      }
      onSaved?.(saved);
      if (isEdit) {
        requestClose();
      } else {
        setCreated(true);
      }
    } catch (err) {
      setError(err.userMessage || err.message || t('wizard.indicator.error_generic', 'Erro ao guardar.'));
    } finally {
      setSaving(false);
    }
  };

  const languageTabs = (
    <div className="flex gap-1 p-1 bg-[#f5f5f5] rounded-xl">
      {[{ k: 'pt', l: 'Português' }, { k: 'en', l: 'English' }].map(({ k, l }) => (
        <button key={k} type="button" onClick={() => setLang(k)}
          className={`flex-1 py-2 px-4 rounded-lg font-['Onest'] font-medium text-[14px] transition-colors cursor-pointer ${lang === k ? 'bg-[#fffefc] text-[#0a0a0a] shadow-sm' : 'text-[#404040] hover:text-[#0a0a0a]'}`}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Onest']">
      <div className={backdropClass} onClick={requestClose} aria-hidden />
      <aside className={`relative h-full w-full sm:w-[58%] sm:min-w-[620px] max-w-[880px] bg-[#fffefc] shadow-2xl flex flex-col ${panelClass}`}>
        {/* Header */}
        <div className="bg-[#f3f4f6] border-b border-[#e0e0e0] px-8 pt-10 pb-8 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
              {isEdit ? t('admin.indicators.edit_title', 'Editar Indicador') : t('admin.indicators.new_title', 'Novo Indicador')}
            </h2>
            <button type="button" onClick={requestClose} aria-label={t('common.close', 'Fechar')} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer">
              <LuX className="w-6 h-6" strokeWidth={1.75} />
            </button>
          </div>
          <p className="font-medium text-[18px] leading-6 text-[#0a0a0a]">
            {isEdit
              ? t('admin.indicators.edit_subtitle', 'Altere os campos necessários para atualizar as informações do indicador.')
              : t('admin.indicators.new_subtitle', 'Preencha todos os campos obrigatórios para adicionar um novo indicador')}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {loading ? (
            <div className="h-full flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>
          ) : (
            <div className="flex flex-col gap-8">
              {error && <div className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/5 px-4 py-3 text-[#dc2626] text-sm">{error}</div>}

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-[24px] text-[#0a0a0a]">{t('admin.indicators.section_general', 'Informações gerais')}</h3>
                  <div className="h-px w-full bg-[#e5e5e5]" />
                </div>

                {languageTabs}

                {lang === 'pt' ? (
                  <FormInput label={t('wizard.indicator.name_pt', 'Nome do indicador')} name="ind_name" value={data.name} onChange={set('name')} placeholder={t('wizard.indicator.name_pt_placeholder', 'Escreva o nome do indicador')} required error={errors.name} />
                ) : (
                  <FormInput label={t('wizard.indicator.name_en', 'Indicator name')} name="ind_name_en" value={data.name_en} onChange={set('name_en')} placeholder={t('wizard.indicator.name_en_placeholder', 'Write the indicator name')} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormSelect label={t('wizard.indicator.area', 'Área')} name="ind_area" value={data.area}
                    onChange={(v) => { set('area')(v); set('dimension')(''); }}
                    options={areas.map(a => ({ value: a.id, label: a.name }))}
                    placeholder={t('wizard.indicator.area_placeholder', 'Selecionar área')} required error={errors.area} />
                  <FormSelect label={t('wizard.indicator.dimension', 'Dimensão')} name="ind_dimension" value={data.dimension}
                    onChange={set('dimension')} options={dimensionOptions}
                    placeholder={t('wizard.indicator.dimension_placeholder', 'Selecionar dimensão')} required error={errors.dimension}
                    disabled={!data.area} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {lang === 'pt' ? (
                    <FormInput label={t('wizard.indicator.unit', 'Unidade')} name="ind_unit" value={data.unit} onChange={set('unit')} placeholder="Ex. m2" />
                  ) : (
                    <FormInput label={t('wizard.indicator.unit_en', 'Unit')} name="ind_unit_en" value={data.unit_en} onChange={set('unit_en')} placeholder="Ex. m2" />
                  )}
                  {lang === 'pt' ? (
                    <FormInput label={t('wizard.indicator.scale', 'Escala')} name="ind_scale" value={data.scale} onChange={set('scale')} placeholder="Ex: Qualidade da água" />
                  ) : (
                    <FormInput label={t('wizard.indicator.scale_en', 'Scale')} name="ind_scale_en" value={data.scale_en} onChange={set('scale_en')} placeholder="Ex: Water quality" />
                  )}
                </div>

                {lang === 'pt' ? (
                  <FormInput label={t('wizard.indicator.source', 'Fonte')} name="ind_font" value={data.font} onChange={set('font')} placeholder={t('wizard.indicator.source_placeholder', 'Escrever fonte')} />
                ) : (
                  <FormInput label={t('wizard.indicator.source_en', 'Source')} name="ind_font_en" value={data.font_en} onChange={set('font_en')} placeholder={t('wizard.indicator.source_en_placeholder', 'Write source')} />
                )}

                {lang === 'pt' ? (
                  <FormTextarea label={t('wizard.indicator.description_pt', 'Descrição')} name="ind_desc" value={data.description} onChange={set('description')} placeholder={t('wizard.indicator.description_pt_placeholder', 'Escrever descrição')} rows={5} required />
                ) : (
                  <FormTextarea label={t('wizard.indicator.description_en', 'Description')} name="ind_desc_en" value={data.description_en} onChange={set('description_en')} placeholder={t('wizard.indicator.description_en_placeholder', 'Write description')} rows={5} />
                )}

                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="w-[18px] h-[18px] rounded border-[#d4d4d4] accent-[#009368]"
                    checked={data.governance} onChange={(e) => set('governance')(e.target.checked)} />
                  <span className="font-medium text-[17px] text-[#0a0a0a]">{t('admin.indicators.col_governance', 'Governança')}</span>
                </label>

                <FormCheckbox
                  label={t('wizard.indicator.carrying_capacity', 'Capacidade de carga')}
                  name="carrying_capacity_enabled"
                  checked={data.carrying_capacity_enabled}
                  onChange={(checked) => set('carrying_capacity_enabled')(checked)}
                  description={t('wizard.indicator.carrying_capacity_desc', 'Define um limite de referência para o indicador.')}
                />
                {data.carrying_capacity_enabled && (
                  <FormInput
                    label={t('wizard.indicator.carrying_capacity_value', 'Valor da capacidade de carga')}
                    name="carrying_capacity"
                    type="number"
                    value={data.carrying_capacity}
                    onChange={set('carrying_capacity')}
                    placeholder={t('wizard.indicator.carrying_capacity_placeholder', 'Ex. 1000')}
                  />
                )}

                <FormCheckbox
                  label={t('wizard.indicator.show_time_averages', 'Mostrar médias temporais')}
                  name="show_time_averages"
                  checked={data.show_time_averages}
                  onChange={(checked) => set('show_time_averages')(checked)}
                  description={t('wizard.indicator.show_time_averages_desc', 'Mostra os botões de média (raw, horário, diário, anual) na página do indicador. Desative para indicadores ambientais como CO, O3, ruído e pluviosidade.')}
                />
              </div>

              {/* Chart types */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-[24px] text-[#0a0a0a]">{t('wizard.indicator.step_charts', 'Gráficos')}</h3>
                  <div className="h-px w-full bg-[#e5e5e5]" />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="font-medium text-[15px] text-[#0a0a0a]">{t('wizard.indicator.chart_types_label', 'Tipos de gráfico disponíveis')}</p>
                  <p className="text-[13px] text-[#737373]">{t('wizard.indicator.chart_types_hint', 'Escolha quais os gráficos que podem ser mostrados neste indicador.')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                    {CHART_TYPES.map(type => (
                      <ChartTypeOption
                        key={type}
                        type={type}
                        label={t(CHART_TYPE_LABEL_KEYS[type])}
                        checked={(data.chart_types || []).includes(type)}
                        onToggle={() => toggleChartType(type)}
                      />
                    ))}
                  </div>
                  {errors.chart_types && <p className="text-[13px] text-[#dc2626]">{errors.chart_types}</p>}
                </div>

                <FormSelect
                  label={t('wizard.indicator.default_chart_type_label', 'Gráfico predefinido')}
                  name="default_chart_type"
                  value={data.default_chart_type || ''}
                  onChange={set('default_chart_type')}
                  options={(data.chart_types || []).map(type => ({ value: type, label: t(CHART_TYPE_LABEL_KEYS[type]) }))}
                  placeholder={t('wizard.indicator.default_chart_type_placeholder', 'Selecionar gráfico predefinido')}
                  required
                  error={errors.default_chart_type}
                  disabled={(data.chart_types || []).length === 0}
                />
                <p className="text-[13px] text-[#737373] -mt-3">{t('wizard.indicator.default_chart_type_hint', 'É o gráfico mostrado por omissão na página do indicador.')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#fafafa] border-t border-[#e0e0e0] px-8 py-6 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={requestClose} disabled={saving}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] disabled:opacity-50 transition-colors cursor-pointer">
            {t('common.cancel', 'Cancelar')}
          </button>
          <div className="flex items-center gap-3">
            {!isEdit && (
              <button type="button" onClick={() => handleSave({ asDraft: true })} disabled={saving}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] disabled:opacity-50 transition-colors cursor-pointer">
                <LuFileText className="w-4 h-4" strokeWidth={1.75} />
                {t('admin.indicators.save_draft', 'Guardar rascunho')}
              </button>
            )}
            {isEdit && data.status === 'draft' && (
              <button type="button" onClick={() => handleSave({ publish: true })} disabled={saving}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[#009368] bg-[#fffefc] font-medium text-[17px] text-[#009368] shadow-sm hover:bg-[#009368]/[0.05] disabled:opacity-50 transition-colors cursor-pointer">
                {t('admin.indicators.publish_draft', 'Publicar')}
              </button>
            )}
            <button type="button" onClick={() => handleSave({ asDraft: false })} disabled={saving}
              className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[17px] text-[#fafafa] transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? t('common.processing', 'A processar...') : (isEdit ? t('admin.indicators.save_changes', 'Guardar alterações') : t('admin.indicators.add', 'Adicionar indicador'))}
            </button>
          </div>
        </div>
      </aside>

      <SuccessModal
        isOpen={created}
        onClose={() => { setCreated(false); requestClose(); }}
        icon={false}
        title={t('admin.indicators.created_success', 'Indicador adicionado!')}
        message={t('admin.indicators.created_message', 'Pode completar o indicador adicionando fontes ou pode fazê-lo mais tarde')}
        primaryAction={{
          label: t('admin.blog.go_home', 'Ir para o início'),
          onClick: () => { setCreated(false); requestClose(); },
        }}
      />
    </div>
  );
}

IndicatorFormPanel.propTypes = {
  indicatorId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};
