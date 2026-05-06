import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Wizard from './Wizard';
import WizardStep from './WizardStep';
import SuccessModal from './SuccessModal';
import ResourceWizard from './ResourceWizard';
import FormInput from '../forms/FormInput';
import FormTextarea from '../forms/FormTextarea';
import FormSelect from '../forms/FormSelect';
import FormCheckbox from '../forms/FormCheckbox';
import useWizard from '../../hooks/useWizard';
import { validateRequired, validateForm, hasErrors } from '../../utils/formValidation';
import indicatorService from '../../services/indicatorService';
import areaService from '../../services/areaService';
import dataService from '../../services/dataService';
import useIndicatorSeries from '../../hooks/useIndicatorSeries';
import ChartTypePreview from './ChartTypePreview';
import {
  CHART_TYPES,
  CHART_TYPE_LABEL_KEYS,
  DEFAULT_CHART_TYPES,
  DEFAULT_CHART_TYPE,
} from '../../constants/chartTypes';

export default function IndicatorWizard({ isOpen, onClose, indicatorId = null, onSuccess = null }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResourceWizard, setShowResourceWizard] = useState(false);
  const [createdIndicatorId, setCreatedIndicatorId] = useState(null);
  const [areas, setAreas] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(false);
  // Real data for the chart-type previews (only populated when editing an
  // existing indicator that already has data). Otherwise previews fall back
  // to a synthetic series inside ChartTypePreview.
  const [previewData, setPreviewData] = useState([]);

  // Columns step is shown only when editing an existing indicator — new
  // indicators have no resources/columns yet, so the step would be empty.
  const showColumnsStep = !!indicatorId;
  const steps = showColumnsStep
    ? [
        t('wizard.indicator.step_info'),
        t('wizard.indicator.step_units'),
        t('wizard.indicator.step_charts'),
        t('wizard.indicator.step_columns', 'Colunas'),
      ]
    : [
        t('wizard.indicator.step_info'),
        t('wizard.indicator.step_units'),
        t('wizard.indicator.step_charts'),
      ];

  const initialData = {
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    area: '',
    dimension: '',
    unit: '',
    unit_en: '',
    scale: '',
    scale_en: '',
    font: '',
    font_en: '',
    periodicity: '',
    periodicity_en: '',
    governance: false,
    carrying_capacity_enabled: false,
    carrying_capacity: '',
    chart_types: [...DEFAULT_CHART_TYPES],
    default_chart_type: DEFAULT_CHART_TYPE,
    hidden_series: [],
    series_translations: {},
  };

  const wizard = useWizard(steps.length, initialData, handleSubmit);

  // Pull the indicator's per-resource series so the column-toggle UI can list
  // every known column (each entry is one line on the chart). Only fires in
  // edit mode — new indicators have no resources yet.
  const { series: knownSeries } = useIndicatorSeries(indicatorId || null, { limit: 1 });
  const knownSeriesLabels = Array.from(new Set(
    (knownSeries || [])
      .map(s => s?.series_label)
      .filter(label => typeof label === 'string' && label.length > 0)
  ));
  // Show any previously-hidden labels that no longer appear in the live data
  // so the admin can still un-hide them — otherwise a label that ends up in
  // hidden_series and then stops being emitted would be stuck off.
  const seriesToggleOptions = Array.from(new Set([
    ...knownSeriesLabels,
    ...(wizard.formData.hidden_series || []),
  ]));

  const toggleHiddenSeries = (label) => {
    const current = wizard.formData.hidden_series || [];
    const next = current.includes(label)
      ? current.filter(l => l !== label)
      : [...current, label];
    wizard.updateFormData('hidden_series', next);
  };

  const updateSeriesTranslation = (label, lang, value) => {
    const current = wizard.formData.series_translations || {};
    // First-time edit: seed the OTHER side with the original label so the
    // user's keystroke in PT doesn't blank out EN (and vice-versa). The
    // render-time fallback only kicks in when the stored value is
    // undefined, so once we write any defined value to the entry we have
    // to make the sibling field defined too — otherwise it would render
    // as the empty string.
    const entry = current[label] || { pt: label, en: label };
    wizard.updateFormData('series_translations', {
      ...current,
      [label]: { ...entry, [lang]: value },
    });
  };

  // Load areas and indicator data on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, indicatorId]);

  // Update dimensions when area changes
  useEffect(() => {
    if (wizard.formData.area) {
      const selectedArea = areas.find(d => d.id === wizard.formData.area);
      if (selectedArea) {
        setDimensions(selectedArea.dimensions || selectedArea.subdominios || []);
      }
    } else {
      setDimensions([]);
    }
  }, [wizard.formData.area, areas]);

  const loadData = async () => {
    try {
      setLoading(true);

      const areasData = await areaService.getAll();
      setAreas(areasData || []);

      if (indicatorId) {
        const indicator = await indicatorService.getById(indicatorId);
        if (indicator) {
          wizard.updateMultipleFields({
            name: indicator.name || '',
            name_en: indicator.name_en || '',
            description: indicator.description || '',
            description_en: indicator.description_en || '',
            // Backend returns the top-level group as `domain` (a populated
            // Domain object on GET, or plain id) and the middle group as
            // `subdomain`. UI state keeps the friendlier names area/dimension.
            area: indicator.domain?.id || indicator.domain || indicator.area?.id || indicator.area || '',
            dimension: indicator.subdomain || indicator.dimension || '',
            unit: indicator.unit || '',
            unit_en: indicator.unit_en || '',
            scale: indicator.scale || '',
            scale_en: indicator.scale_en || '',
            font: indicator.font || '',
            font_en: indicator.font_en || '',
            periodicity: indicator.periodicity || '',
            periodicity_en: indicator.periodicity_en || '',
            governance: indicator.governance || false,
            carrying_capacity_enabled: !!indicator.carrying_capacity,
            carrying_capacity: indicator.carrying_capacity || '',
            chart_types: Array.isArray(indicator.chart_types) && indicator.chart_types.length > 0
              ? indicator.chart_types
              : [...DEFAULT_CHART_TYPES],
            default_chart_type: indicator.default_chart_type || DEFAULT_CHART_TYPE,
            hidden_series: Array.isArray(indicator.hidden_series) ? indicator.hidden_series : [],
            series_translations: (indicator.series_translations && typeof indicator.series_translations === 'object')
              ? indicator.series_translations
              : {},
          });
        }

        // Pull the indicator's real data so chart-type previews reflect what
        // the user will actually see. Failure is non-fatal; previews fall
        // back to the synthetic sample inside ChartTypePreview.
        try {
          const points = await dataService.getIndicatorData(indicatorId, 0, 50);
          if (Array.isArray(points) && points.length > 0) {
            const normalized = points
              .map(p => ({ x: new Date(p.x).getTime(), y: Number(p.y) }))
              .filter(p => !Number.isNaN(p.x) && !Number.isNaN(p.y));
            setPreviewData(normalized);
          }
        } catch (err) {
          console.warn('Chart-type preview: could not fetch indicator data', err);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      const nameError = validateRequired(wizard.formData.name, t('validation.required', { field: t('wizard.indicator.name_pt') }));
      if (nameError) errors.name = nameError;

      const areaError = validateRequired(wizard.formData.area, t('validation.required', { field: t('wizard.indicator.area') }));
      if (areaError) errors.area = areaError;

      const dimensionError = validateRequired(wizard.formData.dimension, t('validation.required', { field: t('wizard.indicator.dimension') }));
      if (dimensionError) errors.dimension = dimensionError;
    }

    if (stepIndex === 2) {
      if (!wizard.formData.chart_types || wizard.formData.chart_types.length === 0) {
        errors.chart_types = t('wizard.indicator.chart_types_required');
      } else if (!wizard.formData.chart_types.includes(wizard.formData.default_chart_type)) {
        errors.default_chart_type = t('wizard.indicator.default_chart_type_invalid');
      }
    }

    return errors;
  };

  const toggleChartType = (type) => {
    const current = wizard.formData.chart_types || [];
    const has = current.includes(type);
    const next = has ? current.filter(t => t !== type) : [...current, type];
    wizard.updateFormData('chart_types', next);
    // Keep default_chart_type consistent: if it got removed, fall back to
    // the first remaining selection.
    if (has && wizard.formData.default_chart_type === type) {
      wizard.updateFormData('default_chart_type', next[0] || '');
    } else if (!wizard.formData.default_chart_type && next.length > 0) {
      wizard.updateFormData('default_chart_type', next[0]);
    }
  };

  const handleNext = () => {
    const errors = validateStep(wizard.currentStep);
    if (hasErrors(errors)) {
      wizard.setValidationErrors(errors);
      return;
    }

    wizard.nextStep();
  };

  async function handleSubmit(data) {
    try {
      const indicatorData = {
        name: data.name.trim(),
        name_en: data.name_en.trim() || '',
        description: data.description.trim() || '',
        description_en: data.description_en.trim() || '',
        font: data.font.trim() || '',
        font_en: (data.font_en || '').trim(),
        scale: data.scale.trim() || '',
        scale_en: (data.scale_en || '').trim(),
        unit: data.unit.trim() || '',
        unit_en: (data.unit_en || '').trim(),
        periodicity: data.periodicity.trim() || '',
        periodicity_en: (data.periodicity_en || '').trim(),
        governance: data.governance,
        carrying_capacity: data.carrying_capacity_enabled && data.carrying_capacity
          ? data.carrying_capacity
          : null,
        favourites: 0,
        chart_types: data.chart_types,
        default_chart_type: data.default_chart_type,
        hidden_series: data.hidden_series || [],
        series_translations: data.series_translations || {},
      };

      let result;
      let savedIndicatorId;

      if (indicatorId) {
        // Backend schema field names are domain / subdomain; map from our
        // UI-facing area / dimension before sending.
        indicatorData.domain = data.area;
        indicatorData.subdomain = data.dimension;
        result = await indicatorService.update(indicatorId, indicatorData);
        savedIndicatorId = indicatorId;
      } else {
        // create() passes these as positional URL segments (domain_id / subdomain_name).
        result = await indicatorService.create(data.area, data.dimension, indicatorData);
        savedIndicatorId = result?.id || result?.indicator_id;
      }

      setCreatedIndicatorId(savedIndicatorId);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving indicator:', error);
      setErrorMessage(error.userMessage || error.message || t('wizard.indicator.error_generic'));
      setShowErrorModal(true);
    }
  }

  const handleAddResources = () => {
    setShowSuccessModal(false);
    setShowResourceWizard(true);
  };

  const handleFinish = () => {
    setShowSuccessModal(false);

    if (onSuccess) {
      onSuccess();
    }

    onClose();
    wizard.reset();
  };

  const handleResourceWizardClose = () => {
    setShowResourceWizard(false);

    if (onSuccess) {
      onSuccess();
    }

    onClose();
    wizard.reset();
  };

  const handleWizardClose = () => {
    if (!wizard.isSubmitting) {
      wizard.reset();
      onClose();
    }
  };

  // Area options for select
  const areaOptions = areas.map(d => ({
    value: d.id,
    label: d.name
  }));

  // Dimension options for select
  const dimensionOptions = dimensions.map(s => ({
    value: typeof s === 'string' ? s : s.name,
    label: typeof s === 'string' ? s : s.name
  }));

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal && !showResourceWizard}
        onClose={handleWizardClose}
        title={indicatorId ? t('wizard.indicator.title_edit') : t('wizard.indicator.title_new')}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting}
        disableNext={loading}
      >
        {wizard.currentStep === 0 && (
          <WizardStep
            title={t('wizard.indicator.step_info')}
            description={t('wizard.indicator.step_info_desc')}
          >
            <FormInput
              label={t('wizard.indicator.name_pt')}
              name="name"
              value={wizard.formData.name}
              onChange={(value) => wizard.updateFormData('name', value)}
              placeholder={t('wizard.indicator.name_pt_placeholder')}
              required
              error={wizard.errors.name}
            />

            <FormInput
              label={t('wizard.indicator.name_en')}
              name="name_en"
              value={wizard.formData.name_en}
              onChange={(value) => wizard.updateFormData('name_en', value)}
              placeholder={t('wizard.indicator.name_en_placeholder')}
            />

            <FormSelect
              label={t('wizard.indicator.area')}
              name="area"
              value={wizard.formData.area}
              onChange={(value) => {
                wizard.updateFormData('area', value);
                wizard.updateFormData('dimension', ''); // Clear dimension when area changes
              }}
              options={areaOptions}
              placeholder={t('wizard.indicator.area_placeholder')}
              required
              error={wizard.errors.area}
              disabled={loading}
            />

            <FormSelect
              label={t('wizard.indicator.dimension')}
              name="dimension"
              value={wizard.formData.dimension}
              onChange={(value) => wizard.updateFormData('dimension', value)}
              options={dimensionOptions}
              placeholder={t('wizard.indicator.dimension_placeholder')}
              required
              error={wizard.errors.dimension}
              disabled={!wizard.formData.area || loading}
            />

            <FormTextarea
              label={t('wizard.indicator.description_pt')}
              name="description"
              value={wizard.formData.description}
              onChange={(value) => wizard.updateFormData('description', value)}
              placeholder={t('wizard.indicator.description_pt_placeholder')}
              rows={4}
            />

            <FormTextarea
              label={t('wizard.indicator.description_en')}
              name="description_en"
              value={wizard.formData.description_en}
              onChange={(value) => wizard.updateFormData('description_en', value)}
              placeholder={t('wizard.indicator.description_en_placeholder')}
              rows={4}
            />
          </WizardStep>
        )}

        {wizard.currentStep === 1 && (
          <WizardStep
            title={t('wizard.indicator.step_units')}
            description={t('wizard.indicator.step_units_desc')}
          >
            <FormInput
              label={t('wizard.indicator.unit')}
              name="unit"
              value={wizard.formData.unit}
              onChange={(value) => wizard.updateFormData('unit', value)}
              placeholder={t('wizard.indicator.unit_placeholder')}
            />
            <FormInput
              label={t('wizard.indicator.unit_en')}
              name="unit_en"
              value={wizard.formData.unit_en}
              onChange={(value) => wizard.updateFormData('unit_en', value)}
              placeholder={t('wizard.indicator.unit_en_placeholder')}
            />

            <FormInput
              label={t('wizard.indicator.scale')}
              name="scale"
              value={wizard.formData.scale}
              onChange={(value) => wizard.updateFormData('scale', value)}
              placeholder={t('wizard.indicator.scale_placeholder')}
            />
            <FormInput
              label={t('wizard.indicator.scale_en')}
              name="scale_en"
              value={wizard.formData.scale_en}
              onChange={(value) => wizard.updateFormData('scale_en', value)}
              placeholder={t('wizard.indicator.scale_en_placeholder')}
            />

            <FormInput
              label={t('wizard.indicator.source')}
              name="font"
              value={wizard.formData.font}
              onChange={(value) => wizard.updateFormData('font', value)}
              placeholder={t('wizard.indicator.source_placeholder')}
            />
            <FormInput
              label={t('wizard.indicator.source_en')}
              name="font_en"
              value={wizard.formData.font_en}
              onChange={(value) => wizard.updateFormData('font_en', value)}
              placeholder={t('wizard.indicator.source_en_placeholder')}
            />

            <FormInput
              label={t('wizard.indicator.periodicity')}
              name="periodicity"
              value={wizard.formData.periodicity}
              onChange={(value) => wizard.updateFormData('periodicity', value)}
              placeholder={t('wizard.indicator.periodicity_placeholder')}
            />
            <FormInput
              label={t('wizard.indicator.periodicity_en')}
              name="periodicity_en"
              value={wizard.formData.periodicity_en}
              onChange={(value) => wizard.updateFormData('periodicity_en', value)}
              placeholder={t('wizard.indicator.periodicity_en_placeholder')}
            />

            <FormCheckbox
              label={t('wizard.indicator.governance')}
              name="governance"
              checked={wizard.formData.governance}
              onChange={(checked) => wizard.updateFormData('governance', checked)}
            />

            <FormCheckbox
              label={t('wizard.indicator.carrying_capacity')}
              name="carrying_capacity_enabled"
              checked={wizard.formData.carrying_capacity_enabled}
              onChange={(checked) => wizard.updateFormData('carrying_capacity_enabled', checked)}
              description={t('wizard.indicator.carrying_capacity_desc')}
            />

            {wizard.formData.carrying_capacity_enabled && (
              <FormInput
                label={t('wizard.indicator.carrying_capacity_value')}
                name="carrying_capacity"
                value={wizard.formData.carrying_capacity}
                onChange={(value) => wizard.updateFormData('carrying_capacity', value)}
                placeholder={t('wizard.indicator.carrying_capacity_placeholder')}
                type="number"
              />
            )}

          </WizardStep>
        )}

        {wizard.currentStep === 2 && (
          <WizardStep
            title={t('wizard.indicator.step_charts')}
            description={t('wizard.indicator.step_charts_desc')}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('wizard.indicator.chart_types_label')}</p>
              <p className="text-xs text-gray-500">{t('wizard.indicator.chart_types_hint')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CHART_TYPES.map(type => {
                  const checked = (wizard.formData.chart_types || []).includes(type);
                  return (
                    <label
                      key={type}
                      className={`flex flex-col gap-2 cursor-pointer border rounded-lg p-2 transition-colors ${
                        checked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={checked}
                          onChange={() => toggleChartType(type)}
                        />
                        <span className="text-sm font-medium">{t(CHART_TYPE_LABEL_KEYS[type])}</span>
                      </div>
                      <div className="w-full h-[90px] bg-white rounded overflow-hidden">
                        <ChartTypePreview chartType={type} data={previewData} height={90} />
                      </div>
                    </label>
                  );
                })}
              </div>
              {wizard.errors.chart_types && (
                <p className="text-xs text-red-600">{wizard.errors.chart_types}</p>
              )}
            </div>

            <div className="mt-4">
              <FormSelect
                label={t('wizard.indicator.default_chart_type_label')}
                name="default_chart_type"
                value={wizard.formData.default_chart_type || ''}
                onChange={(value) => wizard.updateFormData('default_chart_type', value)}
                options={(wizard.formData.chart_types || []).map(type => ({
                  value: type,
                  label: t(CHART_TYPE_LABEL_KEYS[type]),
                }))}
                placeholder={t('wizard.indicator.default_chart_type_placeholder')}
                required
                error={wizard.errors.default_chart_type}
                disabled={(wizard.formData.chart_types || []).length === 0}
              />
              <p className="text-xs text-gray-500 mt-1">{t('wizard.indicator.default_chart_type_hint')}</p>
            </div>

          </WizardStep>
        )}

        {showColumnsStep && wizard.currentStep === 3 && (
          <WizardStep
            title={t('wizard.indicator.step_columns', 'Colunas')}
            description={t('wizard.indicator.step_columns_desc', 'Active/desative colunas e ajuste as traduções PT/EN. As traduções pré-preenchidas vêm do tradutor automático e podem ser editadas.')}
          >
            {seriesToggleOptions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                {t('wizard.indicator.columns_empty', 'Sem colunas nomeadas para este indicador. Adicione um wrapper de várias colunas para ver opções aqui.')}
              </p>
            ) : (
              <div className="space-y-3">
                {seriesToggleOptions.map(label => {
                  const hidden = (wizard.formData.hidden_series || []).includes(label);
                  const checked = !hidden;
                  // Render-time fallback: when the stored translation is
                  // missing/undefined, show the original column label as the
                  // input's actual value (real, deletable text). Once the
                  // admin types or backspaces, the form-state value (which
                  // may be an empty string) takes over so they can also
                  // clear the field.
                  const stored = (wizard.formData.series_translations || {})[label];
                  const ptValue = stored && stored.pt !== undefined ? stored.pt : label;
                  const enValue = stored && stored.en !== undefined ? stored.en : label;
                  return (
                    <div
                      key={label}
                      className={`border rounded-lg p-3 transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={checked}
                          onChange={() => toggleHiddenSeries(label)}
                        />
                        <span className="text-sm font-medium truncate" title={label}>{label}</span>
                        {!checked && (
                          <span className="text-xs text-gray-500 ml-auto">
                            {t('wizard.indicator.column_hidden_badge', 'oculta')}
                          </span>
                        )}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                        <FormInput
                          label={t('wizard.indicator.column_label_pt', 'Etiqueta (PT)')}
                          name={`series_pt_${label}`}
                          value={ptValue}
                          onChange={(v) => updateSeriesTranslation(label, 'pt', v)}
                        />
                        <FormInput
                          label={t('wizard.indicator.column_label_en', 'Label (EN)')}
                          name={`series_en_${label}`}
                          value={enValue}
                          onChange={(v) => updateSeriesTranslation(label, 'en', v)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </WizardStep>
        )}
      </Wizard>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleFinish}
        title={indicatorId ? t('wizard.indicator.success_updated') : t('wizard.indicator.success_added')}
        message={t('wizard.indicator.success_message')}
        primaryAction={{
          label: t('wizard.indicator.add_sources'),
          onClick: handleAddResources,
          closeAfter: false
        }}
        secondaryAction={{
          label: t('wizard.indicator.add_sources_later'),
          onClick: handleFinish
        }}
      />

      <SuccessModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={t('wizard.indicator.error_title', 'Erro')}
        message={errorMessage}
        variant="error"
      />

      {createdIndicatorId && (
        <ResourceWizard
          isOpen={showResourceWizard}
          onClose={handleResourceWizardClose}
          indicatorId={createdIndicatorId}
          onSuccess={handleResourceWizardClose}
        />
      )}
    </>
  );
}

IndicatorWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  indicatorId: PropTypes.string,
  onSuccess: PropTypes.func
};
