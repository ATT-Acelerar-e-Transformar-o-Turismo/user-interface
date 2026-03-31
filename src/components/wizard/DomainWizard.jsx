import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Wizard from './Wizard';
import WizardStep from './WizardStep';
import SuccessModal from './SuccessModal';
import FormInput from '../forms/FormInput';
import FileUpload from '../forms/FileUpload';
import useWizard from '../../hooks/useWizard';
import { validateRequired, hasErrors } from '../../utils/formValidation';
import domainService from '../../services/domainService';
import uploadService from '../../services/uploadService';
import { useDomain } from '../../contexts/DomainContext';

/**
 * DomainWizard - Single-step wizard for creating/editing domains
 * Fields: name, color, subdomains, image URL
 */
export default function DomainWizard({ isOpen, onClose, domainId = null, onSuccess = null }) {
  const { refreshDomains } = useDomain();
  const { t } = useTranslation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subdomainInputPt, setSubdomainInputPt] = useState('');
  const [subdomainInputEn, setSubdomainInputEn] = useState('');

  const steps = [t('wizard.domain.step')];

  const initialData = {
    name: '',
    name_en: '',
    color: '#00855d',
    subdomains: [],
    image: '',
    icon: ''
  };

  const wizard = useWizard(steps.length, initialData, handleSubmit);

  // Load domain data if editing
  useEffect(() => {
    if (isOpen && domainId) {
      loadDomain();
    }
  }, [isOpen, domainId]);

  const loadDomain = async () => {
    try {
      setLoading(true);
      const domain = await domainService.getById(domainId);
      if (domain) {
        wizard.updateMultipleFields({
          name: domain.name || '',
          name_en: domain.name_en || '',
          color: domain.color || '#00855d',
          subdomains: Array.isArray(domain.subdomains) ? domain.subdomains : [],
          image: domain.image || '',
          icon: domain.icon || ''
        });
      }
    } catch (error) {
      console.error('Error loading domain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubdomain = () => {
    if (subdomainInputPt.trim()) {
      const newSubdomain = { name: subdomainInputPt.trim(), name_en: subdomainInputEn.trim() };
      const updatedSubdomains = [...wizard.formData.subdomains, newSubdomain];
      wizard.updateFormData('subdomains', updatedSubdomains);
      setSubdomainInputPt('');
      setSubdomainInputEn('');
    }
  };

  const handleRemoveSubdomain = (index) => {
    const updatedSubdomains = wizard.formData.subdomains.filter((_, i) => i !== index);
    wizard.updateFormData('subdomains', updatedSubdomains);
  };

  // Pressing Enter in either field (PT or EN) adds the subdomain
  const handleSubdomainKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubdomain();
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      const nameError = validateRequired(wizard.formData.name, t('validation.required', { field: t('wizard.domain.name_pt') }));
      if (nameError) errors.name = nameError;
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
      const domainData = {
        name: data.name.trim(),
        name_en: data.name_en.trim() || '',
        color: data.color || '#00855d',
        subdomains: data.subdomains || [],
        image: data.image || '',
        icon: data.icon || ''
      };

      if (domainId) {
        await domainService.update(domainId, domainData);
      } else {
        await domainService.create(domainData);
      }

      // Refresh domains in context
      await refreshDomains();

      setShowSuccessModal(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      throw error;
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(false);
    onClose();
    wizard.reset();
  };

  const handleWizardClose = () => {
    if (!wizard.isSubmitting) {
      wizard.reset();
      setSubdomainInputPt('');
      setSubdomainInputEn('');
      onClose();
    }
  };

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal}
        onClose={handleWizardClose}
        title={domainId ? t('wizard.domain.title_edit') : t('wizard.domain.title_new')}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting}
        disableNext={loading}
        showProgress={false}
      >
        {/* Single Step: Domain Information */}
        {wizard.currentStep === 0 && (
          <WizardStep
            title={t('wizard.domain.step')}
            description={t('wizard.domain.step_desc')}
          >
            <FormInput
              label={t('wizard.domain.name_pt')}
              name="name"
              value={wizard.formData.name}
              onChange={(value) => wizard.updateFormData('name', value)}
              placeholder={t('wizard.domain.name_pt_placeholder')}
              required
              error={wizard.errors.name}
            />

            <FormInput
              label={t('wizard.domain.name_en')}
              name="name_en"
              value={wizard.formData.name_en}
              onChange={(value) => wizard.updateFormData('name_en', value)}
              placeholder={t('wizard.domain.name_en_placeholder')}
            />

            <div className="flex flex-col gap-2">
              <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                {t('wizard.domain.color')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={wizard.formData.color}
                  onChange={(e) => wizard.updateFormData('color', e.target.value)}
                  className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                />
                <span className="font-['Onest',sans-serif] text-sm text-gray-600">
                  {wizard.formData.color}
                </span>
              </div>
            </div>

            <FileUpload
              label={t('wizard.domain.image')}
              name="image"
              value={wizard.formData.image}
              onChange={(value) => wizard.updateFormData('image', value)}
              onUpload={uploadService.uploadDomainImage}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              showPreview={true}
            />

            <FileUpload
              label={t('wizard.domain.icon')}
              name="icon"
              value={wizard.formData.icon}
              onChange={(value) => wizard.updateFormData('icon', value)}
              onUpload={uploadService.uploadDomainIcon}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              showPreview={true}
            />

            {/* Subdomains Management */}
            <div className="flex flex-col gap-2">
              <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                {t('wizard.domain.subdomains')}
              </label>

              {/* Subdomain Input */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subdomainInputPt}
                    onChange={(e) => setSubdomainInputPt(e.target.value)}
                    onKeyPress={(e) => handleSubdomainKeyPress(e)}
                    placeholder={t('wizard.domain.subdomain_pt_placeholder')}
                    className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent focus:border-[#00855d] focus:outline-none focus:ring-2 focus:ring-[#00855d]/20 flex-1"
                  />
                  <input
                    type="text"
                    value={subdomainInputEn}
                    onChange={(e) => setSubdomainInputEn(e.target.value)}
                    onKeyPress={(e) => handleSubdomainKeyPress(e)}
                    placeholder={t('wizard.domain.subdomain_en_placeholder')}
                    className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent focus:border-[#00855d] focus:outline-none focus:ring-2 focus:ring-[#00855d]/20 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubdomain}
                    className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-4 py-3 rounded-lg transition-colors"
                  >
                    {t('wizard.domain.add_subdomain')}
                  </button>
                </div>
              </div>

              {/* Subdomain List */}
              {wizard.formData.subdomains.length > 0 && (
                <div className="bg-[#f1f0f0] rounded-lg p-4 space-y-2">
                  {wizard.formData.subdomains.map((subdomain, index) => {
                    const namePt = typeof subdomain === 'string' ? subdomain : subdomain.name;
                    const nameEn = typeof subdomain === 'string' ? '' : (subdomain.name_en || '');
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-['Onest',sans-serif] text-sm text-black">
                            🇵🇹 {namePt}
                          </span>
                          {nameEn && (
                            <span className="font-['Onest',sans-serif] text-xs text-gray-500">
                              🇬🇧 {nameEn}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubdomain(index)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title={t('wizard.domain.remove_subdomain')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </WizardStep>
        )}
      </Wizard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleFinish}
        title={domainId ? t('wizard.domain.success_updated') : t('wizard.domain.success_added')}
        message={t('wizard.domain.success_message')}
        primaryAction={{
          label: t('wizard.domain.continue'),
          onClick: handleFinish
        }}
      />
    </>
  );
}

DomainWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  domainId: PropTypes.string,
  onSuccess: PropTypes.func
};
