import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Wizard from './Wizard';
import WizardStep from './WizardStep';
import SuccessModal from './SuccessModal';
import FormSelect from '../forms/FormSelect';
import FormInput from '../forms/FormInput';
import FormFileUpload from '../forms/FormFileUpload';
import APIConfigForm from '../APIConfigForm';
import GChart from '../Chart';
import useWizard from '../../hooks/useWizard';
import { validateRequired, validateURL, validateFileSize, validateFileType, hasErrors } from '../../utils/formValidation';
import { useWrapper } from '../../contexts/WrapperContext';
import indicatorService from '../../services/indicatorService';
import resourceService from '../../services/resourceService';

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
  const { uploadFile, generateWrapper, startPolling } = useWrapper();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [indicator, setIndicator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [chartSeries, setChartSeries] = useState([]);
  const [wrapperStatus, setWrapperStatus] = useState(null);

  const isEditMode = !!resourceId;
  const steps = ['Tipo de Fonte', 'Configuração', 'Pré-visualização'];

  const initialData = {
    sourceType: '',
    file: null,
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

  const wizard = useWizard(steps.length, initialData, handleSubmit);

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

  // Parse file when uploaded
  useEffect(() => {
    if (wizard.formData.file) {
      parseFile(wizard.formData.file);
    }
  }, [wizard.formData.file]);

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

  const parseFile = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseXLSX(file);
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        processFileData(result.data);
      },
      header: false,
      skipEmptyLines: true
    });
  };

  const parseXLSX = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      processFileData(sheetData);
    };
    reader.readAsArrayBuffer(file);
  };

  const processFileData = (data) => {
    if (!data || !data.length) return;

    const headers = data[0];
    const rows = data.slice(1).filter(row => row[0] && row[1] !== undefined && row[1] !== null);

    setPreviewData({ headers, rows });

    // Build chart series
    const series = headers.slice(1).map((colName, index) => ({
      name: colName,
      data: rows.map(row => ({
        x: row[0],
        y: parseFloat(row[index + 1]) || null
      }))
    }));

    setChartSeries(series);
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      // Step 1: Source type
      const sourceTypeError = validateRequired(wizard.formData.sourceType, 'Tipo de fonte');
      if (sourceTypeError) errors.sourceType = sourceTypeError;
    }

    if (stepIndex === 1) {
      // Step 2: File or API config
      if (wizard.formData.sourceType === 'API') {
        const urlError = validateURL(wizard.formData.apiConfig.location);
        if (!wizard.formData.apiConfig.location) {
          errors.apiLocation = 'URL da API é obrigatório';
        } else if (urlError) {
          errors.apiLocation = urlError;
        }
      } else {
        // File validation
        if (!wizard.formData.file) {
          errors.file = 'Ficheiro é obrigatório';
        } else {
          const sizeError = validateFileSize(wizard.formData.file, 50);
          const typeError = validateFileType(wizard.formData.file, ['.csv', '.xlsx', '.xls']);

          if (sizeError) errors.file = sizeError;
          else if (typeError) errors.file = typeError;
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
      setWrapperStatus('pending');

      let sourceType;
      let sourceConfig;

      if (data.sourceType === 'API') {
        sourceType = 'API';
        sourceConfig = data.apiConfig;
      } else {
        // Upload file first
        const uploadResponse = await uploadFile(data.file);
        sourceType = data.sourceType;
        sourceConfig = {
          file_id: uploadResponse.file_id
        };
      }

      const wrapperRequest = {
        source_type: sourceType,
        source_config: sourceConfig,
        metadata: {
          name: indicator.name,
          domain: indicator.domain?.name || indicator.domain,
          subdomain: indicator.subdomain,
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
    setPreviewData(null);
    setChartSeries([]);
    setWrapperStatus(null);
    navigate(`/resources-management/${indicatorId}`);
  };

  const handleWizardClose = () => {
    if (!wizard.isSubmitting) {
      wizard.reset();
      setPreviewData(null);
      setChartSeries([]);
      setWrapperStatus(null);
      onClose();
    }
  };

  const sourceTypeOptions = [
    { value: 'CSV', label: 'Ficheiro CSV' },
    { value: 'XLSX', label: 'Ficheiro XLSX' },
    { value: 'API', label: 'API' }
  ];

  const getSubmitLabel = () => {
    if (wrapperStatus === 'pending') return 'A processar...';
    if (wrapperStatus === 'generating') return 'A gerar wrapper...';
    if (wrapperStatus === 'creating_resource') return 'A criar recurso...';
    if (wrapperStatus === 'executing') return 'A executar...';
    return 'Guardar';
  };

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal}
        onClose={handleWizardClose}
        title={isEditMode ? 'Editar Recurso' : 'Adicionar Recurso de Dados'}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting || !!wrapperStatus}
        disableNext={loading}
      >
        {/* Step 1: Source Type Selection */}
        {wizard.currentStep === 0 && (
          <WizardStep
            title="Tipo de Fonte"
            description="Selecione o tipo de fonte de dados"
          >
            {indicator && (
              <div className="bg-[#f1f0f0] rounded-lg p-4 mb-4">
                <h3 className="font-['Onest',sans-serif] font-semibold text-sm text-black mb-2">
                  Indicador
                </h3>
                <p className="font-['Onest',sans-serif] text-sm text-gray-700">
                  {indicator.name}
                </p>
              </div>
            )}

            <FormSelect
              label="Tipo de Fonte"
              name="sourceType"
              value={wizard.formData.sourceType}
              onChange={(value) => wizard.updateFormData('sourceType', value)}
              options={sourceTypeOptions}
              placeholder="Selecione o tipo de fonte"
              required
              error={wizard.errors.sourceType}
              disabled={loading}
            />
          </WizardStep>
        )}

        {/* Step 2: File Upload or API Configuration */}
        {wizard.currentStep === 1 && (
          <WizardStep
            title={wizard.formData.sourceType === 'API' ? 'Configuração de API' : 'Carregar Ficheiro'}
            description={
              wizard.formData.sourceType === 'API'
                ? 'Configure os detalhes da API'
                : 'Carregue o ficheiro de dados'
            }
          >
            {wizard.formData.sourceType === 'API' ? (
              <APIConfigForm
                onConfigChange={(config) => wizard.updateFormData('apiConfig', config)}
                initialConfig={wizard.formData.apiConfig}
              />
            ) : (
              <FormFileUpload
                label="Ficheiro de Dados"
                name="file"
                file={wizard.formData.file}
                onChange={(file) => wizard.updateFormData('file', file)}
                accept=".csv,.xlsx,.xls"
                maxSizeMB={50}
                required
                error={wizard.errors.file}
              />
            )}
          </WizardStep>
        )}

        {/* Step 3: Preview */}
        {wizard.currentStep === 2 && (
          <WizardStep
            title="Pré-visualização"
            description="Visualize os dados antes de guardar"
          >
            {wizard.formData.sourceType === 'API' ? (
              <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                  URL da API configurado: {wizard.formData.apiConfig.location}
                </p>
                <p className="font-['Onest',sans-serif] text-xs text-gray-500 mt-2">
                  Os dados serão carregados após guardar
                </p>
              </div>
            ) : previewData ? (
              <>
                {/* Data Table */}
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#f1f0f0] sticky top-0">
                      <tr>
                        {previewData.headers.map((header, index) => (
                          <th
                            key={index}
                            className="font-['Onest',sans-serif] font-medium text-xs text-black px-3 py-2 border-b border-gray-300"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-200">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="font-['Onest',sans-serif] text-xs text-gray-700 px-3 py-2"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chart */}
                {chartSeries.length > 0 && (
                  <div className="mt-6">
                    <GChart
                      title="Visualização de Dados"
                      chartId="preview-chart"
                      chartType="line"
                      xaxisType="datetime"
                      series={chartSeries}
                      height={300}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                  Nenhum dado para pré-visualizar
                </p>
              </div>
            )}

            {/* Wrapper Status */}
            {wrapperStatus && (
              <div className="mt-4 bg-[#f1f0f0] rounded-lg p-4">
                <p className="font-['Onest',sans-serif] text-sm text-center">
                  {wrapperStatus === 'pending' && '⏳ Aguardando geração...'}
                  {wrapperStatus === 'generating' && '🔄 A gerar wrapper...'}
                  {wrapperStatus === 'creating_resource' && '📝 A criar recurso...'}
                  {wrapperStatus === 'executing' && '▶️ A executar wrapper...'}
                  {wrapperStatus === 'completed' && '✅ Concluído!'}
                  {wrapperStatus === 'error' && '❌ Erro na geração'}
                </p>
              </div>
            )}
          </WizardStep>
        )}
      </Wizard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleFinish}
        title="Fonte Adicionada!"
        message="Parabéns, a fonte foi adicionada com sucesso"
        primaryAction={{
          label: 'Continuar',
          onClick: handleFinish
        }}
      />
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
