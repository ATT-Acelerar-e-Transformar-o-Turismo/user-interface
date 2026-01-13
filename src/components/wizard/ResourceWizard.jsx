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
  const [previewData, setPreviewData] = useState([]);  // Array for multiple files
  const [chartSeries, setChartSeries] = useState([]);
  const [wrapperStatus, setWrapperStatus] = useState(null);
  const [generatingWrappers, setGeneratingWrappers] = useState(false);
  const [wrappersData, setWrappersData] = useState([]);  // Store wrapper info for each file

  const isEditMode = !!resourceId;
  const steps = ['Tipo de Fonte', 'Configuração', 'Pré-visualização'];

  const initialData = {
    sourceType: '',
    files: [],  // Changed to array for multiple files
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

  // Parse files when uploaded
  useEffect(() => {
    if (wizard.formData.files && wizard.formData.files.length > 0) {
      parseMultipleFiles(wizard.formData.files);
    }
  }, [wizard.formData.files]);

  // Auto-generate wrappers when entering preview step (step 2)
  useEffect(() => {
    if (wizard.currentStep === 2 && wizard.formData.files.length > 0 && !generatingWrappers && wrappersData.length === 0) {
      generateWrappersForFiles();
    }
  }, [wizard.currentStep]);

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
        let data;
        if (fileExtension === 'csv') {
          data = await parseCSVPromise(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          data = await parseXLSXPromise(file);
        }

        if (data) {
          parsedDataArray.push({
            fileName: file.name,
            data: data,
            file: file
          });
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
      }
    }

    setPreviewData(parsedDataArray);
  };

  const parseCSVPromise = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          reject(error);
        },
        header: false,
        skipEmptyLines: true
      });
    });
  };

  const parseXLSXPromise = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target.result;
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
          resolve(sheetData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const generateWrappersForFiles = async () => {
    if (!indicator || wizard.formData.files.length === 0) return;

    setGeneratingWrappers(true);
    const wrappers = [];

    try {
      for (let i = 0; i < wizard.formData.files.length; i++) {
        const file = wizard.formData.files[i];
        const sourceType = wizard.formData.sourceType;

        console.log(`Generating wrapper for file: ${file.name}`);

        // Upload file
        const uploadResult = await uploadFile(file);
        console.log(`Upload result for ${file.name}:`, uploadResult);

        // Prepare wrapper request
        const wrapperRequest = {
          source_type: sourceType,
          source_config: {
            file_id: uploadResult.file_id
          },
          metadata: {
            name: `${indicator.name} - ${file.name}`,
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

        console.log(`Wrapper request for ${file.name}:`, wrapperRequest);

        // Generate wrapper
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
          wrapper: wrapper,
          status: wrapper.status,
          resourceId: wrapper.resource_id
        });

        // Start polling for this wrapper
        startPolling(wrapper.wrapper_id, 2000, async (updatedWrapper) => {
          console.log(`Wrapper ${wrapper.wrapper_id} status:`, updatedWrapper.status);

          // Update the status in the wrappers array
          setWrappersData(prev => prev.map(w =>
            w.wrapper.wrapper_id === updatedWrapper.wrapper_id
              ? { ...w, status: updatedWrapper.status, wrapper: updatedWrapper }
              : w
          ));

          // When wrapper completes, fetch the resource data for visualization
          if ((updatedWrapper.status === 'completed' || updatedWrapper.status === 'executing') && updatedWrapper.resource_id) {
            try {
              const resourceData = await resourceService.getById(updatedWrapper.resource_id);
              console.log(`Resource data for ${updatedWrapper.resource_id}:`, resourceData);

              // Update wrapper data with resource info
              setWrappersData(prev => prev.map(w =>
                w.wrapper.wrapper_id === updatedWrapper.wrapper_id
                  ? { ...w, resourceData: resourceData }
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
        // File validation - support multiple files
        if (!wizard.formData.files || wizard.formData.files.length === 0) {
          errors.files = 'Por favor, selecione pelo menos um ficheiro';
        } else {
          // Validate each file
          for (let i = 0; i < wizard.formData.files.length; i++) {
            const file = wizard.formData.files[i];
            const sizeError = validateFileSize(file, 50);
            const typeError = validateFileType(file, ['.csv', '.xlsx', '.xls']);

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
      if (data.sourceType === 'API') {
        // Handle API submission separately
        setWrapperStatus('pending');

        const wrapperRequest = {
          source_type: 'API',
          source_config: data.apiConfig,
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
    navigate(`/resources-management/${indicatorId}`);
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

  // Check if all wrappers are complete
  const allWrappersComplete = wrappersData.length > 0 && wrappersData.every(w =>
    w.status === 'completed' || w.status === 'executing'
  );

  // Disable submit button if wrappers are processing
  const disableSubmit = wizard.currentStep === 2 &&
    wizard.formData.sourceType !== 'API' &&
    (generatingWrappers || !allWrappersComplete);

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
        disableNext={loading || disableSubmit}
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
                label="Ficheiros de Dados"
                name="files"
                files={wizard.formData.files}
                onChange={(files) => wizard.updateFormData('files', files)}
                accept=".csv,.xlsx,.xls"
                maxSizeMB={50}
                multiple={true}
                required
                error={wizard.errors.files}
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
            ) : (
              <div className="space-y-6">
                {/* Generating Wrappers Loading State */}
                {generatingWrappers && (
                  <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-[#00855d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                        A gerar wrappers...
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
                            <svg className="w-5 h-5 text-[#00855d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-['Onest',sans-serif] font-medium text-sm text-black">
                              {wrapperInfo.fileName}
                            </p>
                            <p className="font-['Onest',sans-serif] text-xs text-gray-600">
                              {isComplete && 'Concluído'}
                              {isError && 'Erro'}
                              {isProcessing && 'A processar...'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Wrapper Data Visualization */}
                      {isComplete && wrapperInfo.resourceData && (
                        <div className="mt-4">
                          {/* Show data preview */}
                          <div className="bg-[#f1f0f0] rounded-lg p-3 mb-3">
                            <p className="font-['Onest',sans-serif] text-xs text-gray-700">
                              <strong>Recurso criado:</strong> {wrapperInfo.resourceData.name || 'Sem nome'}
                            </p>
                            {wrapperInfo.resourceData.first_entry_date && (
                              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                                <strong>Primeira entrada:</strong> {new Date(wrapperInfo.resourceData.first_entry_date).toLocaleDateString()}
                              </p>
                            )}
                            {wrapperInfo.resourceData.last_entry_date && (
                              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                                <strong>Última entrada:</strong> {new Date(wrapperInfo.resourceData.last_entry_date).toLocaleDateString()}
                              </p>
                            )}
                            {wrapperInfo.resourceData.total_entries !== undefined && (
                              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                                <strong>Total de entradas:</strong> {wrapperInfo.resourceData.total_entries}
                              </p>
                            )}
                          </div>

                          {/* Show chart if data series available */}
                          {wrapperInfo.resourceData.data && wrapperInfo.resourceData.data.length > 0 && (
                            <GChart
                              title={`Dados - ${wrapperInfo.fileName}`}
                              chartId={`wrapper-chart-${index}`}
                              chartType="line"
                              xaxisType="datetime"
                              series={[{
                                name: wrapperInfo.resourceData.name || 'Data',
                                data: wrapperInfo.resourceData.data.map(entry => ({
                                  x: new Date(entry.date).getTime(),
                                  y: parseFloat(entry.value) || 0
                                }))
                              }]}
                              height={250}
                            />
                          )}
                        </div>
                      )}

                      {/* Loading data message */}
                      {isComplete && !wrapperInfo.resourceData && (
                        <div className="mt-4 bg-[#f1f0f0] rounded-lg p-3">
                          <p className="font-['Onest',sans-serif] text-xs text-center text-gray-600">
                            A carregar dados do recurso...
                          </p>
                        </div>
                      )}

                      {/* Processing Status */}
                      {isProcessing && (
                        <div className="mt-4 bg-[#f1f0f0] rounded-lg p-3">
                          <p className="font-['Onest',sans-serif] text-xs text-center text-gray-600">
                            {wrapperInfo.status === 'pending' && 'Aguardando geração...'}
                            {wrapperInfo.status === 'generating' && 'A gerar wrapper...'}
                            {wrapperInfo.status === 'creating_resource' && 'A criar recurso...'}
                          </p>
                        </div>
                      )}

                      {/* Error Message */}
                      {isError && wrapperInfo.wrapper?.error_message && (
                        <div className="mt-4 bg-red-50 rounded-lg p-3">
                          <p className="font-['Onest',sans-serif] text-xs text-red-600">
                            {wrapperInfo.wrapper.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Fallback if no wrappers yet */}
                {wrappersData.length === 0 && !generatingWrappers && previewData.length > 0 && (
                  <div className="bg-[#f1f0f0] rounded-lg p-6 text-center">
                    <p className="font-['Onest',sans-serif] text-sm text-gray-600">
                      {previewData.length} ficheiro(s) carregado(s). A gerar wrappers...
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
        title={wrappersData.length > 1 ? 'Fontes Adicionadas!' : 'Fonte Adicionada!'}
        message={
          wrappersData.length > 1
            ? `Parabéns, ${wrappersData.length} fontes foram adicionadas com sucesso`
            : 'Parabéns, a fonte foi adicionada com sucesso'
        }
        primaryAction={{
          label: 'Sair',
          onClick: handleFinish
        }}
        secondaryAction={{
          label: 'Adicionar Nova Fonte',
          onClick: handleAddNewResource
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
