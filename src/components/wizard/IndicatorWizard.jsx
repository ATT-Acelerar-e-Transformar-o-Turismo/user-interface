import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import domainService from '../../services/domainService';

/**
 * IndicatorWizard - Multi-step wizard for creating/editing indicators
 * Step 1: Name & Description (with domain/subdomain selection)
 * Step 2: Units & Measures
 */
export default function IndicatorWizard({ isOpen, onClose, indicatorId = null, onSuccess = null }) {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResourceWizard, setShowResourceWizard] = useState(false);
  const [createdIndicatorId, setCreatedIndicatorId] = useState(null);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track component lifecycle
  useEffect(() => {
    console.log('IndicatorWizard: Component MOUNTED');
    return () => {
      console.log('IndicatorWizard: Component UNMOUNTED');
    };
  }, []);

  // Track when showSuccessModal changes
  useEffect(() => {
    console.log('IndicatorWizard: showSuccessModal changed to:', showSuccessModal);
  }, [showSuccessModal]);

  // Track when createdIndicatorId changes
  useEffect(() => {
    console.log('IndicatorWizard: createdIndicatorId changed to:', createdIndicatorId);
  }, [createdIndicatorId]);

  const steps = ['Nome & Descrição', 'Unidades & Medidas'];

  const initialData = {
    name: '',
    description: '',
    domain: '',
    subdomain: '',
    unit: '',
    scale: '',
    font: '',
    periodicity: '',
    governance: false,
    carrying_capacity_enabled: false,
    carrying_capacity: ''
  };

  const wizard = useWizard(steps.length, initialData, handleSubmit);

  // Load domains and indicator data on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, indicatorId]);

  // Update subdomains when domain changes
  useEffect(() => {
    if (wizard.formData.domain) {
      const selectedDomain = domains.find(d => d.id === wizard.formData.domain);
      if (selectedDomain) {
        setSubdomains(selectedDomain.subdomains || selectedDomain.subdominios || []);
      }
    } else {
      setSubdomains([]);
    }
  }, [wizard.formData.domain, domains]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load domains
      const domainsData = await domainService.getAll();
      setDomains(domainsData || []);

      // If editing, load indicator data
      if (indicatorId) {
        const indicator = await indicatorService.getById(indicatorId);
        if (indicator) {
          wizard.updateMultipleFields({
            name: indicator.name || '',
            description: indicator.description || '',
            domain: indicator.domain?.id || indicator.domain || '',
            subdomain: indicator.subdomain || '',
            unit: indicator.unit || '',
            scale: indicator.scale || '',
            font: indicator.font || '',
            periodicity: indicator.periodicity || '',
            governance: indicator.governance || false,
            carrying_capacity_enabled: !!indicator.carrying_capacity,
            carrying_capacity: indicator.carrying_capacity || ''
          });
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
      // Step 1: Name & Description
      const nameError = validateRequired(wizard.formData.name, 'Nome');
      if (nameError) errors.name = nameError;

      const domainError = validateRequired(wizard.formData.domain, 'Domínio');
      if (domainError) errors.domain = domainError;

      const subdomainError = validateRequired(wizard.formData.subdomain, 'Subdomínio');
      if (subdomainError) errors.subdomain = subdomainError;
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
      console.log('IndicatorWizard: Starting submission...', data);

      const indicatorData = {
        name: data.name.trim(),
        description: data.description.trim() || '',
        font: data.font.trim() || '',
        scale: data.scale.trim() || '',
        unit: data.unit.trim() || '',
        periodicity: data.periodicity.trim() || '',
        governance: data.governance,
        carrying_capacity: data.carrying_capacity_enabled && data.carrying_capacity
          ? data.carrying_capacity
          : null,
        favourites: 0
      };

      let result;
      let savedIndicatorId;

      if (indicatorId) {
        // Update existing indicator
        indicatorData.domain = data.domain;
        indicatorData.subdomain = data.subdomain;
        result = await indicatorService.update(indicatorId, indicatorData);
        savedIndicatorId = indicatorId;
        console.log('IndicatorWizard: Updated indicator:', savedIndicatorId);
      } else {
        // Create new indicator
        console.log('IndicatorWizard: Creating indicator with domain:', data.domain, 'subdomain:', data.subdomain);
        result = await indicatorService.create(data.domain, data.subdomain, indicatorData);
        savedIndicatorId = result?.id || result?.indicator_id;
        console.log('IndicatorWizard: Created indicator, result:', result, 'savedId:', savedIndicatorId);
      }

      // Store created indicator ID for success modal actions
      // Use a functional update to ensure we have the latest state
      setCreatedIndicatorId(savedIndicatorId);
      console.log('IndicatorWizard: Set createdIndicatorId to:', savedIndicatorId);

      // Show success modal
      setShowSuccessModal(true);
      console.log('IndicatorWizard: Set showSuccessModal to true');

      // DON'T call onSuccess immediately - it causes parent re-render which resets our state
      // We'll call it when the user finishes the entire flow
      // if (onSuccess) {
      //   onSuccess(result);
      // }
    } catch (error) {
      console.error('IndicatorWizard: Error saving indicator:', error);
      throw error;
    }
  }

  const handleAddResources = () => {
    console.log('IndicatorWizard: handleAddResources called, createdIndicatorId:', createdIndicatorId);
    setShowSuccessModal(false);
    setShowResourceWizard(true);
    console.log('IndicatorWizard: Set showSuccessModal=false, showResourceWizard=true');
  };

  const handleFinish = () => {
    console.log('IndicatorWizard: handleFinish called');
    setShowSuccessModal(false);

    // Call parent's onSuccess callback now that user is done
    if (onSuccess) {
      onSuccess();
    }

    onClose();
    wizard.reset();
  };

  const handleResourceWizardClose = () => {
    console.log('IndicatorWizard: handleResourceWizardClose called');
    setShowResourceWizard(false);

    // Call parent's onSuccess callback now that user is done
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

  // Domain options for select
  const domainOptions = domains.map(d => ({
    value: d.id,
    label: d.name
  }));

  // Subdomain options for select
  const subdomainOptions = subdomains.map(s => ({
    value: typeof s === 'string' ? s : s.name,
    label: typeof s === 'string' ? s : s.name
  }));

  // Debug logging
  console.log('IndicatorWizard render:', {
    isOpen,
    showSuccessModal,
    showResourceWizard,
    createdIndicatorId,
    wizardVisible: isOpen && !showSuccessModal && !showResourceWizard
  });

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal && !showResourceWizard}
        onClose={handleWizardClose}
        title={indicatorId ? 'Editar Indicador' : 'Novo Indicador'}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting}
        disableNext={loading}
      >
        {/* Step 1: Name & Description */}
        {wizard.currentStep === 0 && (
          <WizardStep
            title="Nome & Descrição"
            description="Informações básicas sobre o indicador"
          >
            <FormInput
              label="Nome do Indicador"
              name="name"
              value={wizard.formData.name}
              onChange={(value) => wizard.updateFormData('name', value)}
              placeholder="Digite o nome do indicador"
              required
              error={wizard.errors.name}
            />

            <FormSelect
              label="Domínio"
              name="domain"
              value={wizard.formData.domain}
              onChange={(value) => {
                wizard.updateFormData('domain', value);
                wizard.updateFormData('subdomain', ''); // Clear subdomain when domain changes
              }}
              options={domainOptions}
              placeholder="Selecione um domínio"
              required
              error={wizard.errors.domain}
              disabled={loading}
            />

            <FormSelect
              label="Subdomínio"
              name="subdomain"
              value={wizard.formData.subdomain}
              onChange={(value) => wizard.updateFormData('subdomain', value)}
              options={subdomainOptions}
              placeholder="Selecione um subdomínio"
              required
              error={wizard.errors.subdomain}
              disabled={!wizard.formData.domain || loading}
            />

            <FormTextarea
              label="Descrição"
              name="description"
              value={wizard.formData.description}
              onChange={(value) => wizard.updateFormData('description', value)}
              placeholder="Descreva o indicador (opcional)"
              rows={4}
            />
          </WizardStep>
        )}

        {/* Step 2: Units & Measures */}
        {wizard.currentStep === 1 && (
          <WizardStep
            title="Unidades & Medidas"
            description="Especifique as unidades e medidas do indicador"
          >
            <FormInput
              label="Unidade"
              name="unit"
              value={wizard.formData.unit}
              onChange={(value) => wizard.updateFormData('unit', value)}
              placeholder="Ex: %, km, toneladas"
            />

            <FormInput
              label="Escala"
              name="scale"
              value={wizard.formData.scale}
              onChange={(value) => wizard.updateFormData('scale', value)}
              placeholder="Ex: 1:1000, local, regional"
            />

            <FormInput
              label="Fonte"
              name="font"
              value={wizard.formData.font}
              onChange={(value) => wizard.updateFormData('font', value)}
              placeholder="Fonte dos dados"
            />

            <FormInput
              label="Periodicidade"
              name="periodicity"
              value={wizard.formData.periodicity}
              onChange={(value) => wizard.updateFormData('periodicity', value)}
              placeholder="Ex: anual, mensal, trimestral"
            />

            <FormCheckbox
              label="Indicador de Governança"
              name="governance"
              checked={wizard.formData.governance}
              onChange={(checked) => wizard.updateFormData('governance', checked)}
            />

            <FormCheckbox
              label="Capacidade de Carga"
              name="carrying_capacity_enabled"
              checked={wizard.formData.carrying_capacity_enabled}
              onChange={(checked) => wizard.updateFormData('carrying_capacity_enabled', checked)}
              description="Ativar limite de capacidade de carga"
            />

            {wizard.formData.carrying_capacity_enabled && (
              <FormInput
                label="Valor Limite de Capacidade de Carga"
                name="carrying_capacity"
                value={wizard.formData.carrying_capacity}
                onChange={(value) => wizard.updateFormData('carrying_capacity', value)}
                placeholder="Digite o valor limite"
                type="number"
              />
            )}
          </WizardStep>
        )}
      </Wizard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleFinish}
        title={indicatorId ? 'Indicador Atualizado!' : 'Indicador Adicionado!'}
        message="Deseja adicionar fontes de dados agora?"
        primaryAction={{
          label: 'Adicionar Fontes',
          onClick: handleAddResources,
          closeAfter: false  // Don't auto-close, we're opening another wizard
        }}
        secondaryAction={{
          label: 'Adicionar fontes mais tarde',
          onClick: handleFinish
        }}
      />

      {/* Resource Wizard */}
      {createdIndicatorId && (
        <ResourceWizard
          isOpen={showResourceWizard}
          onClose={handleResourceWizardClose}
          indicatorId={createdIndicatorId}
          onSuccess={() => {
            // Resource added successfully, close everything
            handleResourceWizardClose();
          }}
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
