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
import areaService from '../../services/areaService';
import uploadService from '../../services/uploadService';
import { useArea } from '../../contexts/AreaContext';

/**
 * AreaWizard - Single-step wizard for creating/editing areas
 * Fields: name, color, dimensions, image URL
 */
export default function AreaWizard({ isOpen, onClose, areaId = null, onSuccess = null }) {
  const { refreshAreas } = useArea();
  const { t } = useTranslation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dimensionInputPt, setDimensionInputPt] = useState('');
  const [dimensionInputEn, setDimensionInputEn] = useState('');

  const steps = [t('wizard.area.step')];

  const initialData = {
    name: '',
    name_en: '',
    color: '#00855d',
    dimensions: [],
    image: '',
    icon: ''
  };

  const wizard = useWizard(steps.length, initialData, handleSubmit);

  // Load area data if editing
  useEffect(() => {
    if (isOpen && areaId) {
      loadArea();
    }
  }, [isOpen, areaId]);

  const loadArea = async () => {
    try {
      setLoading(true);
      const area = await areaService.getById(areaId);
      if (area) {
        wizard.updateMultipleFields({
          name: area.name || '',
          name_en: area.name_en || '',
          color: area.color || '#00855d',
          dimensions: Array.isArray(area.dimensions) ? area.dimensions : [],
          image: area.image || '',
          icon: area.icon || ''
        });
      }
    } catch (error) {
      console.error('Error loading area:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDimension = () => {
    if (dimensionInputPt.trim()) {
      const newDimension = { name: dimensionInputPt.trim(), name_en: dimensionInputEn.trim() };
      const updatedDimensions = [...wizard.formData.dimensions, newDimension];
      wizard.updateFormData('dimensions', updatedDimensions);
      setDimensionInputPt('');
      setDimensionInputEn('');
    }
  };

  const handleRemoveDimension = (index) => {
    const updatedDimensions = wizard.formData.dimensions.filter((_, i) => i !== index);
    wizard.updateFormData('dimensions', updatedDimensions);
  };

  // Pressing Enter in either field (PT or EN) adds the dimension
  const handleDimensionKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDimension();
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      const nameError = validateRequired(wizard.formData.name, t('validation.required', { field: t('wizard.area.name_pt') }));
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
      const areaData = {
        name: data.name.trim(),
        name_en: data.name_en.trim() || '',
        color: data.color || '#00855d',
        dimensions: data.dimensions || [],
        image: data.image || '',
        icon: data.icon || ''
      };

      if (areaId) {
        await areaService.update(areaId, areaData);
      } else {
        await areaService.create(areaData);
      }

      // Refresh areas in context
      await refreshAreas();

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving area:', error);
      setErrorMessage(error.userMessage || error.message || t('wizard.area.error_generic', 'Ocorreu um erro ao guardar o área'));
      setShowErrorModal(true);
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(false);
    onClose();
    wizard.reset();
    if (onSuccess) onSuccess();
  };

  const handleWizardClose = () => {
    if (!wizard.isSubmitting) {
      wizard.reset();
      setDimensionInputPt('');
      setDimensionInputEn('');
      onClose();
    }
  };

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal}
        onClose={handleWizardClose}
        title={areaId ? t('wizard.area.title_edit') : t('wizard.area.title_new')}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting}
        disableNext={loading}
        showProgress={false}
      >
        {/* Single Step: Area Information */}
        {wizard.currentStep === 0 && (
          <WizardStep
            title={t('wizard.area.step')}
            description={t('wizard.area.step_desc')}
          >
            <FormInput
              label={t('wizard.area.name_pt')}
              name="name"
              value={wizard.formData.name}
              onChange={(value) => wizard.updateFormData('name', value)}
              placeholder={t('wizard.area.name_pt_placeholder')}
              required
              error={wizard.errors.name}
            />

            <FormInput
              label={t('wizard.area.name_en')}
              name="name_en"
              value={wizard.formData.name_en}
              onChange={(value) => wizard.updateFormData('name_en', value)}
              placeholder={t('wizard.area.name_en_placeholder')}
            />

            <div className="flex flex-col gap-2">
              <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                {t('wizard.area.color')}
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
              label={t('wizard.area.image')}
              name="image"
              value={wizard.formData.image}
              onChange={(value) => wizard.updateFormData('image', value)}
              onUpload={uploadService.uploadAreaImage}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              showPreview={true}
            />

            <FileUpload
              label={t('wizard.area.icon')}
              name="icon"
              value={wizard.formData.icon}
              onChange={(value) => wizard.updateFormData('icon', value)}
              onUpload={uploadService.uploadAreaIcon}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              showPreview={true}
            />

            {/* Dimensions Management */}
            <div className="flex flex-col gap-2">
              <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                {t('wizard.area.dimensions')}
              </label>

              {/* Dimension Input */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dimensionInputPt}
                    onChange={(e) => setDimensionInputPt(e.target.value)}
                    onKeyPress={(e) => handleDimensionKeyPress(e)}
                    placeholder={t('wizard.area.dimension_pt_placeholder')}
                    className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1"
                  />
                  <input
                    type="text"
                    value={dimensionInputEn}
                    onChange={(e) => setDimensionInputEn(e.target.value)}
                    onKeyPress={(e) => handleDimensionKeyPress(e)}
                    placeholder={t('wizard.area.dimension_en_placeholder')}
                    className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddDimension}
                    className="font-['Onest',sans-serif] text-sm font-medium text-white bg-primary hover:bg-[color:var(--color-primary-hover)] px-4 py-3 rounded-lg transition-colors"
                  >
                    {t('wizard.area.add_dimension')}
                  </button>
                </div>
              </div>

              {/* Dimension List */}
              {wizard.formData.dimensions.length > 0 && (
                <div className="bg-[#f1f0f0] rounded-lg p-4 space-y-2">
                  {wizard.formData.dimensions.map((dimension, index) => {
                    const namePt = typeof dimension === 'string' ? dimension : dimension.name;
                    const nameEn = typeof dimension === 'string' ? '' : (dimension.name_en || '');
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
                          onClick={() => handleRemoveDimension(index)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title={t('wizard.area.remove_dimension')}
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
        title={areaId ? t('wizard.area.success_updated') : t('wizard.area.success_added')}
        message={t('wizard.area.success_message')}
        primaryAction={{
          label: t('wizard.area.continue'),
          onClick: handleFinish
        }}
      />

      {/* Error Modal */}
      <SuccessModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={t('wizard.area.error_title', 'Erro')}
        message={errorMessage}
        variant="error"
      />
    </>
  );
}

AreaWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  areaId: PropTypes.string,
  onSuccess: PropTypes.func
};
