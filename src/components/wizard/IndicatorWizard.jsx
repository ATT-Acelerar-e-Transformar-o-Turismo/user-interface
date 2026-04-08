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
import domainService from '../../services/domainService';

export default function IndicatorWizard({ isOpen, onClose, indicatorId = null, onSuccess = null }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResourceWizard, setShowResourceWizard] = useState(false);
  const [createdIndicatorId, setCreatedIndicatorId] = useState(null);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(false);

  const steps = [t('wizard.indicator.step_info'), t('wizard.indicator.step_units')];

  const initialData = {
    name: '',
    name_en: '',
    description: '',
    description_en: '',
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

      const domainsData = await domainService.getAll();
      setDomains(domainsData || []);

      if (indicatorId) {
        const indicator = await indicatorService.getById(indicatorId);
        if (indicator) {
          wizard.updateMultipleFields({
            name: indicator.name || '',
            name_en: indicator.name_en || '',
            description: indicator.description || '',
            description_en: indicator.description_en || '',
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
      const nameError = validateRequired(wizard.formData.name, t('validation.required', { field: t('wizard.indicator.name_pt') }));
      if (nameError) errors.name = nameError;

      const domainError = validateRequired(wizard.formData.domain, t('validation.required', { field: t('wizard.indicator.domain') }));
      if (domainError) errors.domain = domainError;

      const subdomainError = validateRequired(wizard.formData.subdomain, t('validation.required', { field: t('wizard.indicator.subdomain') }));
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
      const indicatorData = {
        name: data.name.trim(),
        name_en: data.name_en.trim() || '',
        description: data.description.trim() || '',
        description_en: data.description_en.trim() || '',
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
        indicatorData.domain = data.domain;
        indicatorData.subdomain = data.subdomain;
        result = await indicatorService.update(indicatorId, indicatorData);
        savedIndicatorId = indicatorId;
      } else {
        result = await indicatorService.create(data.domain, data.subdomain, indicatorData);
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
              label={t('wizard.indicator.domain')}
              name="domain"
              value={wizard.formData.domain}
              onChange={(value) => {
                wizard.updateFormData('domain', value);
                wizard.updateFormData('subdomain', ''); // Clear subdomain when domain changes
              }}
              options={domainOptions}
              placeholder={t('wizard.indicator.domain_placeholder')}
              required
              error={wizard.errors.domain}
              disabled={loading}
            />

            <FormSelect
              label={t('wizard.indicator.subdomain')}
              name="subdomain"
              value={wizard.formData.subdomain}
              onChange={(value) => wizard.updateFormData('subdomain', value)}
              options={subdomainOptions}
              placeholder={t('wizard.indicator.subdomain_placeholder')}
              required
              error={wizard.errors.subdomain}
              disabled={!wizard.formData.domain || loading}
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
              label={t('wizard.indicator.scale')}
              name="scale"
              value={wizard.formData.scale}
              onChange={(value) => wizard.updateFormData('scale', value)}
              placeholder={t('wizard.indicator.scale_placeholder')}
            />

            <FormInput
              label={t('wizard.indicator.source')}
              name="font"
              value={wizard.formData.font}
              onChange={(value) => wizard.updateFormData('font', value)}
              placeholder={t('wizard.indicator.source_placeholder')}
            />

            <FormInput
              label={t('wizard.indicator.periodicity')}
              name="periodicity"
              value={wizard.formData.periodicity}
              onChange={(value) => wizard.updateFormData('periodicity', value)}
              placeholder={t('wizard.indicator.periodicity_placeholder')}
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
