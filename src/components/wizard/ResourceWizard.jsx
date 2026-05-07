import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import Wizard from './Wizard';
import WizardStep from './WizardStep';
import SuccessModal from './SuccessModal';
import RegenerateWrapperButton from './RegenerateWrapperButton';
import FormSelect from '../forms/FormSelect';
import FormInput from '../forms/FormInput';
import FormFileUpload from '../forms/FormFileUpload';
import APIConfigForm from '../APIConfigForm';
import IndicatorPicker from './IndicatorPicker';
import useLocalizedName from '../../hooks/useLocalizedName';
import GChart from '../Chart';
import useWizard from '../../hooks/useWizard';
import { showError } from '../../utils/toast';
import { validateRequired, validateURL, validateFileSize, validateFileType, hasErrors } from '../../utils/formValidation';
import { useWrapper } from '../../contexts/WrapperContext';
import indicatorService from '../../services/indicatorService';
import resourceService from '../../services/resourceService';
import { pickDefaultTimeColumn, defaultColumnSelectionForFile } from '../../utils/chartSeries';

/**
 * ResourceWizard - Multi-step wizard for adding data resources
 * Step 1: Select source type (CSV, XLSX, API)
 * Step 2: Upload file OR configure API
 * Step 3: Preview data
 */
export default function ResourceWizard({
  isOpen,
  onClose,
  indicatorId,
  resourceId = null,
  onSuccess = null
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getName = useLocalizedName();
  const { uploadFile, generateWrapper, startPolling } = useWrapper();
  const [previewModal, setPreviewModal] = useState({ open: false, wrapperId: null, loading: false, data: [], error: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [indicator, setIndicator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);  // Array for multiple files
  const [chartSeries, setChartSeries] = useState([]);
  const [wrapperStatus, setWrapperStatus] = useState(null);
  const [generatingWrappers, setGeneratingWrappers] = useState(false);
  const [wrappersData, setWrappersData] = useState([]);  // Store wrapper info for each file

  const isEditMode = !!resourceId;

  const initialData = {
    sourceType: '',
    files: [],  // Changed to array for multiple files
    columnSelections: {},  // {fileName: {sheetName, timeColumn, valueColumns: []}}
    // Indicator-mode picker state. Each entry: {id, name, domain, subdomain}.
    selectedIndicators: [],
    apiConfig: {
      location: '',
      auth_type: 'none',
      api_key: '',
      api_key_header: 'X-API-Key',
      bearer_token: '',
      username: '',
      password: '',
      timeout_seconds: 30,
      date_field: '',
      value_field: '',
      custom_headers: {},
      query_params: {}
    }
  };

  // Allocate enough slots for the longest path (file mode = 4 steps). For API
  // mode we render only 3 step labels via the `steps` array below; <Wizard>'s
  // isLastStep is driven by that array, so the user submits at the right
  // place. useWizard's totalSteps just caps the high end of nextStep.
  const wizard = useWizard(4, initialData, handleSubmit);

  // Steps shown in the progress indicator. File mode inserts a "columns" step
  // between upload and preview where the user picks sheet + which columns to
  // import as separate series. Indicator (composed) mode mirrors API mode:
  // 3 steps with no column-picker.
  const fileMode = ['CSV', 'XLSX'].includes(wizard.formData.sourceType);
  const indicatorMode = wizard.formData.sourceType === 'INDICATOR';
  const steps = fileMode
    ? [
        t('wizard.resource.step_type'),
        t('wizard.resource.step_config'),
        t('wizard.resource.step_columns', 'Selecionar colunas'),
        t('wizard.resource.step_preview'),
      ]
    : [
        t('wizard.resource.step_type'),
        indicatorMode
          ? t('wizard.resource.step_indicator', 'Selecionar indicador')
          : t('wizard.resource.step_config'),
        t('wizard.resource.step_preview'),
      ];

  // Load indicator data
  useEffect(() => {
    if (isOpen && indicatorId) {
      loadIndicator();
    }
  }, [isOpen, indicatorId]);

  // Load existing resource if editing
  useEffect(() => {
    if (isOpen && resourceId) {
      loadExistingResource();
    }
  }, [isOpen, resourceId]);

  // Parse files when uploaded
  useEffect(() => {
    if (wizard.formData.files && wizard.formData.files.length > 0) {
      parseMultipleFiles(wizard.formData.files);
    }
  }, [wizard.formData.files]);

  // Auto-generate wrappers when entering the preview step. Index depends on
  // mode: file mode has a column-picker step in the middle, so preview is at
  // index 3; API and INDICATOR modes preview is at index 2.
  const previewStepIndex = fileMode ? 3 : 2;
  useEffect(() => {
    if (
      wizard.currentStep === previewStepIndex
      && fileMode
      && wizard.formData.files.length > 0
      && !generatingWrappers
      && wrappersData.length === 0
    ) {
      generateWrappersForFiles();
    }
  }, [wizard.currentStep, previewStepIndex, fileMode]);

  const loadIndicator = async () => {
    try {
      setLoading(true);
      const data = await indicatorService.getById(indicatorId);
      setIndicator(data);
    } catch (error) {
      console.error('Error loading indicator:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingResource = async () => {
    try {
      setLoading(true);
      const resource = await resourceService.getById(resourceId);

      if (resource.wrapper_id) {
        const wrapper = await resourceService.getWrapper(resource.wrapper_id);
        const sourceType = wrapper.source_type;

        wizard.updateFormData('sourceType', sourceType);

        if (sourceType === 'API' && wrapper.source_config) {
          wizard.updateFormData('apiConfig', {
            location: wrapper.source_config.location || '',
            auth_type: wrapper.source_config.auth_type || 'none',
            api_key: wrapper.source_config.api_key || '',
            api_key_header: wrapper.source_config.api_key_header || 'X-API-Key',
            bearer_token: wrapper.source_config.bearer_token || '',
            username: wrapper.source_config.username || '',
            password: wrapper.source_config.password || '',
            timeout_seconds: wrapper.source_config.timeout_seconds || 30,
            date_field: wrapper.source_config.date_field || '',
            value_field: wrapper.source_config.value_field || '',
            custom_headers: wrapper.source_config.custom_headers || {},
            query_params: wrapper.source_config.query_params || {}
          });
        }
      }
    } catch (error) {
      console.error('Error loading resource:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseMultipleFiles = async (files) => {
    const parsedDataArray = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop().toLowerCase();

      try {
        let parsed;
        if (fileExtension === 'csv') {
          parsed = await parseCSVPromise(file);
        } else if (fileExtension === 'xlsx') {
          parsed = await parseXLSXPromise(file);
        }

        if (parsed) {
          parsedDataArray.push({
            fileName: file.name,
            parsed,
            file,
          });
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
      }
    }

    setPreviewData(parsedDataArray);

    // Initialise sensible column-picker defaults whenever files are (re)parsed.
    // Existing user choices for unchanged files are preserved.
    const prev = wizard.formData.columnSelections || {};
    const next = {};
    for (const item of parsedDataArray) {
      next[item.fileName] = prev[item.fileName] || defaultColumnSelectionForFile(item.parsed);
    }
    wizard.updateFormData('columnSelections', next);
  };

  // Returns {kind:'csv', columns:[string], rowCount:number}.
  const parseCSVPromise = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (result) => {
          const rows = result.data || [];
          const headerRow = rows[0] || [];
          const columns = headerRow.map(c => (c == null ? '' : String(c).trim())).filter(c => c.length > 0);
          resolve({ kind: 'csv', columns, rowCount: Math.max(0, rows.length - 1) });
        },
        error: (error) => reject(error),
        header: false,
        skipEmptyLines: true,
      });
    });
  };

  // Returns {kind:'xlsx', sheets:[{name, columns:[string], rowCount:number}]}.
  // Headers come from the first row of each sheet.
  const parseXLSXPromise = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(arrayBuffer);
          const sheets = workbook.worksheets.map(ws => {
            const headers = [];
            const firstRow = ws.getRow(1);
            firstRow.eachCell({ includeEmpty: true }, (cell) => {
              let v = cell.value;
              // ExcelJS represents formulas / hyperlinks / dates as objects.
              if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
              if (v && typeof v === 'object' && v.text !== undefined) v = v.text;
              headers.push(v == null ? '' : String(v).trim());
            });
            const columns = headers.filter(h => h.length > 0);
            const rowCount = Math.max(0, (ws.actualRowCount || ws.rowCount || 0) - 1);
            return { name: ws.name, columns, rowCount };
          });
          resolve({ kind: 'xlsx', sheets });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Update one file's column selection. Used by the picker UI.
  const updateColumnSelection = (fileName, patch) => {
    const prev = wizard.formData.columnSelections || {};
    wizard.updateFormData('columnSelections', {
      ...prev,
      [fileName]: { ...(prev[fileName] || {}), ...patch },
    });
  };

  // For an XLSX file, fetch the columns of a specific sheet from the parsed
  // metadata. CSV files have a single column list.
  const getColumnsForFile = (fileName) => {
    const item = previewData.find(p => p.fileName === fileName);
    if (!item) return [];
    const sel = wizard.formData.columnSelections?.[fileName];
    if (item.parsed.kind === 'xlsx') {
      const sheet = (item.parsed.sheets || []).find(s => s.name === sel?.sheetName)
        || item.parsed.sheets?.[0];
      return sheet?.columns || [];
    }
    return item.parsed.columns || [];
  };

  const generateWrappersForFiles = async () => {
    if (!indicator || wizard.formData.files.length === 0) return;

    setGeneratingWrappers(true);
    const wrappers = [];

    try {
      for (let i = 0; i < wizard.formData.files.length; i++) {
        const file = wizard.formData.files[i];
        const sourceType = wizard.formData.sourceType;
        const selection = wizard.formData.columnSelections?.[file.name] || {};
        const valueColumns = (selection.valueColumns && selection.valueColumns.length > 0)
          ? selection.valueColumns
          : null;

        console.log(`Generating wrapper for file: ${file.name} — ${valueColumns?.length || '?'} column(s)`);

        // One wrapper per file. The wrapper emits one DataPoint per (row ×
        // selected column), tagging each with the column name in `series`.
        // The chart on the indicator page splits those into separate lines.
        const uploadResult = await uploadFile(file);
        console.log(`Upload result for ${file.name}:`, uploadResult);

        const wrapperRequest = {
          source_type: sourceType,
          source_config: {
            file_id: uploadResult.file_id,
            ...(selection.sheetName ? { sheet_name: selection.sheetName } : {}),
            ...(selection.timeColumn ? { time_column: selection.timeColumn } : {}),
            ...(valueColumns ? { value_columns: valueColumns } : {}),
          },
          metadata: {
            // One resource per file → resource name reflects the file, not
            // any single column.
            name: `${indicator.name} - ${file.name}`,
            // Backend IndicatorMetadata requires `domain` / `subdomain`.
            // Indicator docs expose these as `domain` (object or id) and
            // `subdomain` (string); legacy fallbacks to `area` / `dimension`.
            domain: indicator.domain?.name || (typeof indicator.domain === 'string' ? indicator.domain : '')
              || indicator.area?.name || indicator.area || '',
            subdomain: indicator.subdomain || indicator.dimension || '',
            description: indicator.description || '',
            unit: indicator.unit || '',
            source: indicator.font || '',
            scale: indicator.scale || '',
            governance_indicator: indicator.governance || false,
            carrying_capacity: indicator.carrying_capacity || null,
            periodicity: indicator.periodicity || ''
          },
          auto_create_resource: true
        };

        console.log(`Wrapper request for ${file.name}:`, wrapperRequest);

        const wrapper = await generateWrapper(wrapperRequest);
        console.log(`Wrapper generated for ${file.name}:`, wrapper);

        if (wrapper.resource_id && !isEditMode) {
          try {
            await indicatorService.addResource(indicatorId, wrapper.resource_id);
            console.log(`Resource ${wrapper.resource_id} linked to indicator ${indicatorId}`);
          } catch (linkError) {
            console.error(`Failed to link resource ${wrapper.resource_id} to indicator:`, linkError);
          }
        }

        wrappers.push({
          fileName: file.name,
          wrapper,
          status: wrapper.status,
          resourceId: wrapper.resource_id,
        });

        startPolling(wrapper.wrapper_id, 2000, async (updatedWrapper) => {
          console.log(`Wrapper ${wrapper.wrapper_id} status:`, updatedWrapper.status);

          setWrappersData(prev => {
            const prevEntry = prev.find(w => w.wrapper.wrapper_id === updatedWrapper.wrapper_id);
            const prevStatus = prevEntry?.status;
            // First transition into `error` for this wrapper: surface it to
            // the user. Without this they just see the card sit in "Processing"
            // or "Done" with no chart — silent failure.
            if (updatedWrapper.status === 'error' && prevStatus !== 'error') {
              const name = prevEntry?.fileName || updatedWrapper.wrapper_id;
              const reason = updatedWrapper.error_message || t('wizard.resource.generation_failed');
              showError(`${name}: ${reason}`, 10000);
            }
            return prev.map(w =>
              w.wrapper.wrapper_id === updatedWrapper.wrapper_id
                ? { ...w, status: updatedWrapper.status, wrapper: updatedWrapper }
                : w
            );
          });

          // Fetch resource metadata once wrapper is running or finished, so the
          // card can show name / period / point count. Chart data is fetched
          // on-demand when the user clicks "Preview data".
          if ((updatedWrapper.status === 'completed' || updatedWrapper.status === 'executing') && updatedWrapper.resource_id) {
            try {
              const resourceData = await resourceService.getById(updatedWrapper.resource_id);
              setWrappersData(prev => prev.map(w =>
                w.wrapper.wrapper_id === updatedWrapper.wrapper_id
                  ? { ...w, resourceData }
                  : w
              ));
            } catch (error) {
              console.error(`Error fetching resource data for ${updatedWrapper.resource_id}:`, error);
            }
          }
        });
      }

      setWrappersData(wrappers);
      console.log('All wrappers generated:', wrappers);
    } catch (error) {
      console.error('Error generating wrappers:', error);
    } finally {
      setGeneratingWrappers(false);
    }
  };

  const openPreview = async (wrapperInfo) => {
    const wrapperId = wrapperInfo.wrapper.wrapper_id;
    const resourceId = wrapperInfo.resourceId || wrapperInfo.wrapper.resource_id;
    setPreviewModal({ open: true, wrapperId, loading: true, data: [], error: null });
    try {
      const dataResult = await resourceService.getResourceData(resourceId);
      setPreviewModal({ open: true, wrapperId, loading: false, data: dataResult.data || [], error: null });
    } catch (error) {
      console.error('Failed to load preview data:', error);
      setPreviewModal({ open: true, wrapperId, loading: false, data: [], error: error?.userMessage || t('wizard.resource.preview_load_failed') });
    }
  };

  const closePreview = () => setPreviewModal({ open: false, wrapperId: null, loading: false, data: [], error: null });

  // Called by RegenerateWrapperButton after a successful re-queue: reset
  // the card's cached resource data and resume polling so the UI reflects
  // the new generation lifecycle.
  const handleRegenerated = (updated) => {
    const wrapperId = updated.wrapper_id;
    setWrappersData(prev => prev.map(w =>
      w.wrapper.wrapper_id === wrapperId
        ? { ...w, status: updated.status, wrapper: updated, resourceData: undefined }
        : w
    ));
    startPolling(wrapperId, 2000, async (updatedWrapper) => {
      setWrappersData(prev => {
        const prevEntry = prev.find(w => w.wrapper.wrapper_id === updatedWrapper.wrapper_id);
        const prevStatus = prevEntry?.status;
        if (updatedWrapper.status === 'error' && prevStatus !== 'error') {
          const name = prevEntry?.fileName || updatedWrapper.wrapper_id;
          const reason = updatedWrapper.error_message || t('wizard.resource.generation_failed');
          showError(`${name}: ${reason}`, 10000);
        }
        return prev.map(w =>
          w.wrapper.wrapper_id === updatedWrapper.wrapper_id
            ? { ...w, status: updatedWrapper.status, wrapper: updatedWrapper }
            : w
        );
      });
      if ((updatedWrapper.status === 'completed' || updatedWrapper.status === 'executing') && updatedWrapper.resource_id) {
        try {
          const resourceData = await resourceService.getById(updatedWrapper.resource_id);
          setWrappersData(prev => prev.map(w =>
            w.wrapper.wrapper_id === updatedWrapper.wrapper_id
              ? { ...w, resourceData }
              : w
          ));
        } catch (error) {
          console.error(`Error fetching resource data for ${updatedWrapper.resource_id}:`, error);
        }
      }
    });
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      // Step 1: Source type
      const sourceTypeError = validateRequired(wizard.formData.sourceType, t('validation.required', { field: t('wizard.resource.source_type') }));
      if (sourceTypeError) errors.sourceType = sourceTypeError;
    }

    if (stepIndex === 1) {
      // Step 2: File / API config / Indicator picker
      if (wizard.formData.sourceType === 'API') {
        const urlError = validateURL(wizard.formData.apiConfig.location);
        if (!wizard.formData.apiConfig.location) {
          errors.apiLocation = t('wizard.resource.api_url_required');
        } else if (urlError) {
          errors.apiLocation = urlError;
        }
      } else if (wizard.formData.sourceType === 'INDICATOR') {
        if (!wizard.formData.selectedIndicators || wizard.formData.selectedIndicators.length === 0) {
          errors.selectedIndicators = t(
            'wizard.resource.indicator_required',
            'Selecione pelo menos um indicador.',
          );
        }
      } else {
        // File validation - support multiple files
        if (!wizard.formData.files || wizard.formData.files.length === 0) {
          errors.files = t('wizard.resource.file_required');
        } else {
          // Validate each file
          for (let i = 0; i < wizard.formData.files.length; i++) {
            const file = wizard.formData.files[i];
            const sizeError = validateFileSize(file, 50);
            const typeError = validateFileType(file, ['.csv', '.xlsx']);

            if (sizeError) {
              errors.files = `${file.name}: ${sizeError}`;
              break;
            } else if (typeError) {
              errors.files = `${file.name}: ${typeError}`;
              break;
            }
          }
        }
      }
    }

    // Column-picker step (file mode only). Each file must end up with at least
    // one value column selected, otherwise nothing would be imported.
    if (fileMode && stepIndex === 2) {
      const sels = wizard.formData.columnSelections || {};
      const files = wizard.formData.files || [];
      for (const file of files) {
        const sel = sels[file.name];
        if (!sel || !sel.timeColumn || !sel.valueColumns || sel.valueColumns.length === 0) {
          errors.columnSelections = t(
            'wizard.resource.columns_required',
            'Escolha a coluna de tempo e pelo menos uma coluna de valores em cada ficheiro.',
          );
          break;
        }
      }
    }

    return errors;
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
      if (data.sourceType === 'INDICATOR') {
        // Composed indicator: each picked indicator becomes a child of the
        // current one. The backend rejects cycles and self-inclusion; surface
        // those errors to the user without poisoning the success path.
        const picked = data.selectedIndicators || [];
        if (picked.length === 0) {
          throw new Error(t('wizard.resource.indicator_required', 'Selecione pelo menos um indicador.'));
        }
        const failures = [];
        for (const ind of picked) {
          try {
            await indicatorService.addChildIndicator(indicatorId, ind.id);
          } catch (err) {
            const msg = err?.response?.data?.detail || err?.userMessage || err?.message || 'Erro';
            failures.push({ name: ind.name, msg });
          }
        }
        if (failures.length === picked.length) {
          throw new Error(failures.map(f => `${f.name}: ${f.msg}`).join('; '));
        }
        if (failures.length > 0) {
          showError(failures.map(f => `${f.name}: ${f.msg}`).join(' / '), 8000);
        }
      } else if (data.sourceType === 'API') {
        // Handle API submission separately
        setWrapperStatus('pending');

        const wrapperRequest = {
          source_type: 'API',
          source_config: data.apiConfig,
          metadata: {
            name: indicator.name,
            domain: indicator.domain?.name || (typeof indicator.domain === 'string' ? indicator.domain : '')
              || indicator.area?.name || indicator.area || '',
            subdomain: indicator.subdomain || indicator.dimension || '',
            description: indicator.description || '',
            unit: indicator.unit || '',
            source: indicator.font || '',
            scale: indicator.scale || '',
            governance_indicator: indicator.governance || false,
            carrying_capacity: indicator.carrying_capacity || null,
            periodicity: indicator.periodicity || ''
          },
          auto_create_resource: true
        };

        const wrapper = await generateWrapper(wrapperRequest);
        setWrapperStatus(wrapper.status);

        // Link resource to indicator if not editing
        if (wrapper.resource_id && !isEditMode) {
          await indicatorService.addResource(indicatorId, wrapper.resource_id);
        }

        // Poll for completion
        await new Promise((resolve, reject) => {
          startPolling(wrapper.wrapper_id, 2000, (updatedWrapper) => {
            setWrapperStatus(updatedWrapper.status);

            if (updatedWrapper.status === 'completed' || updatedWrapper.status === 'executing') {
              resolve(updatedWrapper);
            } else if (updatedWrapper.status === 'error') {
              reject(new Error(updatedWrapper.error_message || 'Wrapper generation failed'));
            }
          });
        });
      } else {
        // For file uploads, wrappers are already generated in preview step
        // Just verify all wrappers are complete
        const allComplete = wrappersData.every(w =>
          w.status === 'completed' || w.status === 'executing'
        );

        if (!allComplete) {
          throw new Error('Alguns ficheiros ainda estão a ser processados. Por favor, aguarde.');
        }

        // Link all resources to indicator
        for (const wrapperInfo of wrappersData) {
          if (wrapperInfo.resourceId && !isEditMode) {
            await indicatorService.addResource(indicatorId, wrapperInfo.resourceId);
          }
        }

        console.log('All resources linked to indicator:', indicatorId);
      }

      setShowSuccessModal(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      setWrapperStatus('error');
      throw error;
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(false);
    onClose();
    wizard.reset();
    setPreviewData([]);
    setChartSeries([]);
    setWrapperStatus(null);
    setWrappersData([]);
    setGeneratingWrappers(false);
    navigate(`/admin/resources-management/${indicatorId}`);
  };

  const handleAddNewResource = () => {
    // Keep the modal closed and reset the wizard state for new resource
    setShowSuccessModal(false);
    wizard.reset();
    setPreviewData([]);
    setChartSeries([]);
    setWrapperStatus(null);
    setWrappersData([]);
    setGeneratingWrappers(false);
    // Don't navigate away - stay in wizard to add another resource
  };

  const handleWizardClose = () => {
    if (!wizard.isSubmitting) {
      wizard.reset();
      setPreviewData([]);
      setChartSeries([]);
      setWrapperStatus(null);
      setWrappersData([]);
      setGeneratingWrappers(false);
      onClose();
    }
  };

  const sourceTypeOptions = [
    { value: 'CSV', label: t('wizard.resource.source_csv') },
    { value: 'XLSX', label: t('wizard.resource.source_xlsx') },
    { value: 'API', label: t('wizard.resource.source_api') },
    { value: 'INDICATOR', label: t('wizard.resource.source_indicator', 'Indicador existente') },
  ];

  const getSubmitLabel = () => {
    if (wrapperStatus === 'pending') return 'A processar...';
    if (wrapperStatus === 'generating') return 'A gerar wrapper...';
    if (wrapperStatus === 'creating_resource') return 'A criar recurso...';
    if (wrapperStatus === 'executing') return 'A executar...';
    return 'Guardar';
  };

  // Check if all wrappers are complete
  const allWrappersComplete = wrappersData.length > 0 && wrappersData.every(w =>
    w.status === 'completed' || w.status === 'executing'
  );

  // Disable submit on the preview step (last step in file mode = 3, API/
  // INDICATOR = 2) until every wrapper has completed at least once. API and
  // INDICATOR modes don't generate wrappers in the wizard, so they bypass
  // this check.
  const disableSubmit = wizard.currentStep === previewStepIndex &&
    fileMode &&
    (generatingWrappers || !allWrappersComplete);

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal}
        onClose={handleWizardClose}
        title={isEditMode ? t('wizard.resource.title_edit') : t('wizard.resource.title_new')}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting || !!wrapperStatus}
        disableNext={loading || disableSubmit}
      >
        {/* Step 1: Source Type Selection */}
        {wizard.currentStep === 0 && (
          <WizardStep
            title={t('wizard.resource.step_type')}
            description={t('wizard.resource.step_type_desc')}
          >
            {indicator && (
              <div className="bg-[#f1f0f0] rounded-lg p-4 mb-4">
                <h3 className="font-['Onest',sans-serif] font-semibold text-sm text-black mb-2">
                  {t('wizard.resource.indicator_label')}
                </h3>
                <p className="font-['Onest',sans-serif] text-sm text-gray-700">
                  {indicator.name}
                </p>
              </div>
            )}

            <FormSelect
              label={t('wizard.resource.source_type')}
              name="sourceType"
              value={wizard.formData.sourceType}
              onChange={(value) => wizard.updateFormData('sourceType', value)}
              options={sourceTypeOptions}
              placeholder={t('wizard.resource.source_type_placeholder')}
              required
              error={wizard.errors.sourceType}
              disabled={loading}
            />
          </WizardStep>
        )}

        {/* Step 2: File Upload, API Configuration, or Indicator Picker */}
        {wizard.currentStep === 1 && (
          <WizardStep
            title={
              wizard.formData.sourceType === 'API'
                ? t('wizard.resource.step_api_title')
                : wizard.formData.sourceType === 'INDICATOR'
                  ? t('wizard.resource.step_indicator_title', 'Selecionar indicador')
                  : t('wizard.resource.step_file_title')
            }
            description={
              wizard.formData.sourceType === 'API'
                ? t('wizard.resource.step_api_desc')
                : wizard.formData.sourceType === 'INDICATOR'
                  ? t(
                      'wizard.resource.step_indicator_desc',
                      'Escolha um ou mais indicadores existentes — os seus dados aparecerão lado a lado no gráfico.',
                    )
                  : t('wizard.resource.step_file_desc')
            }
          >
            {wizard.formData.sourceType === 'API' ? (
              <APIConfigForm
                onConfigChange={(config) => wizard.updateFormData('apiConfig', config)}
                initialConfig={wizard.formData.apiConfig}
              />
            ) : wizard.formData.sourceType === 'INDICATOR' ? (
              <IndicatorPicker
                excludeId={indicatorId}
                excludeIds={indicator?.child_indicators || []}
                selected={wizard.formData.selectedIndicators || []}
                onChange={(arr) => wizard.updateFormData('selectedIndicators', arr)}
                error={wizard.errors.selectedIndicators}
              />
            ) : (
              <FormFileUpload
                label={t('wizard.resource.files_label')}
                name="files"
                files={wizard.formData.files}
                onChange={(files) => wizard.updateFormData('files', files)}
                accept=".csv,.xlsx"
                maxSizeMB={50}
                multiple={true}
                required
                error={wizard.errors.files}
              />
            )}
          </WizardStep>
        )}

        {/* Step 3: Column picker — file mode only. Lets the user pick the
            sheet (XLSX) and which columns become separate series. */}
        {fileMode && wizard.currentStep === 2 && (
          <WizardStep
            title={t('wizard.resource.step_columns', 'Selecionar colunas')}
            description={t(
              'wizard.resource.step_columns_desc',
              'Escolha a coluna de tempo (X) e marque cada coluna a importar — cada uma cria uma linha separada no gráfico.',
            )}
          >
            {wizard.errors.columnSelections && (
              <div className="mb-3 p-3 rounded-lg bg-red-50 text-sm text-red-700">
                {wizard.errors.columnSelections}
              </div>
            )}
            <div className="space-y-6">
              {previewData.length === 0 && (
                <p className="text-sm text-gray-500">{t('wizard.resource.parsing_files', 'A analisar os ficheiros…')}</p>
              )}
              {previewData.map((item) => {
                const sel = wizard.formData.columnSelections?.[item.fileName] || {};
                const isXlsx = item.parsed.kind === 'xlsx';
                const sheets = isXlsx ? (item.parsed.sheets || []) : [];
                const columns = getColumnsForFile(item.fileName);
                return (
                  <div key={item.fileName} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium text-sm text-black">{item.fileName}</p>
                    </div>

                    {isXlsx && sheets.length > 1 && (
                      <FormSelect
                        label={t('wizard.resource.sheet_label', 'Folha')}
                        name={`sheet_${item.fileName}`}
                        value={sel.sheetName || ''}
                        onChange={(value) => {
                          // Reset column choices when the sheet changes — the
                          // column lists from different sheets won't overlap.
                          const sheet = sheets.find(s => s.name === value);
                          const cols = sheet?.columns || [];
                          const time = pickDefaultTimeColumn(cols);
                          updateColumnSelection(item.fileName, {
                            sheetName: value,
                            timeColumn: time,
                            valueColumns: cols.filter(c => c !== time),
                          });
                        }}
                        options={sheets.map(s => ({ value: s.name, label: `${s.name} (${s.rowCount} linhas)` }))}
                      />
                    )}

                    {columns.length === 0 ? (
                      <p className="text-xs text-gray-500">{t('wizard.resource.no_columns', 'Não foram detetadas colunas nesta folha.')}</p>
                    ) : (
                      <>
                        <FormSelect
                          label={t('wizard.resource.time_column_label', 'Coluna de tempo (X)')}
                          name={`time_${item.fileName}`}
                          value={sel.timeColumn || ''}
                          onChange={(value) => {
                            // Time column should not also appear as a value column.
                            const valueColumns = (sel.valueColumns || []).filter(c => c !== value);
                            updateColumnSelection(item.fileName, { timeColumn: value, valueColumns });
                          }}
                          options={columns.map(c => ({ value: c, label: c }))}
                        />
                        <div>
                          <p className="text-sm font-medium mb-2">
                            {t('wizard.resource.value_columns_label', 'Colunas a importar (uma linha por cada)')}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {columns.filter(c => c !== sel.timeColumn).map(col => {
                              const checked = (sel.valueColumns || []).includes(col);
                              return (
                                <label key={col} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked
                                        ? (sel.valueColumns || []).filter(c => c !== col)
                                        : [...(sel.valueColumns || []), col];
                                      updateColumnSelection(item.fileName, { valueColumns: next });
                                    }}
                                  />
                                  <span>{col}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </WizardStep>
        )}

        {/* Last step: Preview — index 3 in file mode, 2 in API mode. */}
        {wizard.currentStep === previewStepIndex && (
          <WizardStep
            title={t('wizard.resource.step_preview')}
            description={t('wizard.resource.step_preview_desc')}
          >
            {wizard.formData.sourceType === 'API' ? (
              <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                  {t('wizard.resource.api_url_label')} {wizard.formData.apiConfig.location}
                </p>
                <p className="font-['Onest',sans-serif] text-xs text-gray-500 mt-2">
                  {t('wizard.resource.api_url_pending')}
                </p>
              </div>
            ) : wizard.formData.sourceType === 'INDICATOR' ? (
              <div className="space-y-3">
                <p className="font-['Onest',sans-serif] text-sm text-gray-700">
                  {t(
                    'wizard.resource.indicator_review',
                    'Os seguintes indicadores serão incluídos:',
                  )}
                </p>
                <ul className="space-y-2">
                  {(wizard.formData.selectedIndicators || []).map((ind) => (
                    <li
                      key={ind.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-[#f1f0f0] rounded flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l4-4 5 5 9-9M21 4h-6M21 4v6" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-['Onest',sans-serif] text-sm text-black truncate">
                          {getName(ind)}
                        </p>
                        {(ind.domain_name || ind.subdomain) && (
                          <p className="font-['Onest',sans-serif] text-xs text-gray-500 truncate">
                            {[ind.domain_name, ind.subdomain].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Generating Wrappers Loading State */}
                {generatingWrappers && (
                  <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                        {t('wizard.resource.generating_wrappers')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Display Wrappers with Charts */}
                {wrappersData.length > 0 && wrappersData.map((wrapperInfo, index) => {
                  const isComplete = wrapperInfo.status === 'completed' || wrapperInfo.status === 'executing';
                  const isError = wrapperInfo.status === 'error';
                  const isProcessing = wrapperInfo.status === 'pending' || wrapperInfo.status === 'generating' || wrapperInfo.status === 'creating_resource';

                  return (
                    <div key={index} className="border border-gray-300 rounded-lg p-4">
                      {/* File Name and Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f1f0f0] rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-['Onest',sans-serif] font-medium text-sm text-black">
                              {wrapperInfo.fileName}
                            </p>
                            <p className="font-['Onest',sans-serif] text-xs text-gray-600">
                              {isComplete && t('wizard.resource.status_done')}
                              {isError && t('wizard.resource.status_error')}
                              {isProcessing && t('wizard.resource.status_processing')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Wrapper Data Visualization */}
                      {isComplete && wrapperInfo.resourceData && (
                        <div className="mt-4">
                          <div className="bg-[#f1f0f0] rounded-lg p-3 mb-3">
                            <p className="font-['Onest',sans-serif] text-xs text-gray-700">
                              <strong>{t('wizard.resource.resource_created')}</strong> {wrapperInfo.resourceData.name || t('wizard.resource.no_name')}
                            </p>
                            {wrapperInfo.resourceData.startPeriod && (
                              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                                <strong>{t('wizard.resource.first_entry')}</strong> {new Date(wrapperInfo.resourceData.startPeriod).toLocaleDateString()}
                              </p>
                            )}
                            {wrapperInfo.resourceData.endPeriod && (
                              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                                <strong>{t('wizard.resource.last_entry')}</strong> {new Date(wrapperInfo.resourceData.endPeriod).toLocaleDateString()}
                              </p>
                            )}
                            {wrapperInfo.wrapper?.data_points_count != null && (
                              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                                <strong>{t('wizard.resource.total_entries')}</strong> {wrapperInfo.wrapper.data_points_count}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => openPreview(wrapperInfo)}
                            >
                              {t('wizard.resource.preview_data')}
                            </button>
                            <RegenerateWrapperButton
                              wrapperId={wrapperInfo.wrapper.wrapper_id}
                              onRegenerated={handleRegenerated}
                            />
                          </div>
                        </div>
                      )}

                      {/* Loading data message */}
                      {isComplete && !wrapperInfo.resourceData && (
                        <div className="mt-4 bg-[#f1f0f0] rounded-lg p-3">
                          <p className="font-['Onest',sans-serif] text-xs text-center text-gray-600">
                            {t('wizard.resource.loading_resource')}
                          </p>
                        </div>
                      )}

                      {/* Processing Status */}
                      {isProcessing && (
                        <div className="mt-4 bg-[#f1f0f0] rounded-lg p-3">
                          <p className="font-['Onest',sans-serif] text-xs text-center text-gray-600">
                            {wrapperInfo.status === 'pending' && t('wizard.resource.status_pending')}
                            {wrapperInfo.status === 'generating' && t('wizard.resource.status_generating')}
                            {wrapperInfo.status === 'creating_resource' && t('wizard.resource.status_creating')}
                          </p>
                        </div>
                      )}

                      {/* Error state: show message + Regenerate action. */}
                      {isError && (
                        <div className="mt-4 space-y-2">
                          {wrapperInfo.wrapper?.error_message && (
                            <div className="bg-red-50 rounded-lg p-3">
                              <p className="font-['Onest',sans-serif] text-xs text-red-600">
                                {wrapperInfo.wrapper.error_message}
                              </p>
                            </div>
                          )}
                          <RegenerateWrapperButton
                            wrapperId={wrapperInfo.wrapper.wrapper_id}
                            onRegenerated={handleRegenerated}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Fallback if no wrappers yet */}
                {wrappersData.length === 0 && !generatingWrappers && previewData.length > 0 && (
                  <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                    <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                      {t('wizard.resource.files_loaded', { count: previewData.length })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </WizardStep>
        )}
      </Wizard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleFinish}
        title={wrappersData.length > 1 ? t('wizard.resource.success_multiple') : t('wizard.resource.success_single')}
        message={
          wrappersData.length > 1
            ? t('wizard.resource.success_msg_multiple', { count: wrappersData.length })
            : t('wizard.resource.success_msg_single')
        }
        primaryAction={{
          label: t('wizard.resource.exit'),
          onClick: handleFinish
        }}
        secondaryAction={{
          label: t('wizard.resource.add_new'),
          onClick: handleAddNewResource
        }}
      />

      {previewModal.open && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl">
            <h3 className="font-bold text-lg mb-4">{t('wizard.resource.preview_title')}</h3>
            {previewModal.loading && (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-lg" />
              </div>
            )}
            {!previewModal.loading && previewModal.error && (
              <div className="alert alert-error">
                <span>{previewModal.error}</span>
              </div>
            )}
            {!previewModal.loading && !previewModal.error && previewModal.data.length === 0 && (
              <p className="text-sm text-gray-600">{t('wizard.resource.preview_empty')}</p>
            )}
            {!previewModal.loading && !previewModal.error && previewModal.data.length > 0 && (
              <GChart
                title={t('wizard.resource.preview_title')}
                chartId={`preview-chart-${previewModal.wrapperId}`}
                chartType="line"
                xaxisType="datetime"
                series={[{
                  name: t('wizard.resource.preview_series_name'),
                  data: previewModal.data.map(p => ({
                    x: new Date(p.x).getTime(),
                    y: parseFloat(p.y) || 0,
                  })),
                }]}
                height={350}
                disableAnimations={true}
              />
            )}
            <div className="modal-action">
              <button type="button" className="btn" onClick={closePreview}>
                {t('common.close')}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={closePreview}>
            <button>close</button>
          </form>
        </dialog>
      )}

    </>
  );
}

ResourceWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  indicatorId: PropTypes.string.isRequired,
  resourceId: PropTypes.string,
  onSuccess: PropTypes.func
};
