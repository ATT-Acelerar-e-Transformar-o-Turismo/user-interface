import { useState, useCallback } from 'react';

/**
 * useWizard - Custom hook for managing multi-step wizard state
 *
 * @param {number} totalSteps - Total number of steps in the wizard
 * @param {Object} initialData - Initial form data
 * @param {Function} onSubmit - Callback function to handle final submission
 * @returns {Object} Wizard state and navigation methods
 */
export default function useWizard(totalSteps, initialData = {}, onSubmit = null) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Update form data for a specific field
   */
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Update multiple form fields at once
   */
  const updateMultipleFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }));
  }, []);

  /**
   * Set validation errors
   */
  const setValidationErrors = useCallback((validationErrors) => {
    setErrors(validationErrors);
  }, []);

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      clearErrors();
    }
  }, [currentStep, totalSteps, clearErrors]);

  /**
   * Navigate to previous step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      clearErrors();
    }
  }, [currentStep, clearErrors]);

  /**
   * Navigate to a specific step
   */
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
      clearErrors();
    }
  }, [totalSteps, clearErrors]);

  /**
   * Check if we're on the first step
   */
  const isFirstStep = currentStep === 0;

  /**
   * Check if we're on the last step
   */
  const isLastStep = currentStep === totalSteps - 1;

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;

    try {
      setIsSubmitting(true);
      clearErrors();
      await onSubmit(formData);
    } catch (error) {
      console.error('Wizard submission error:', error);
      if (error.validationErrors) {
        setErrors(error.validationErrors);
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, clearErrors]);

  /**
   * Reset wizard to initial state
   */
  const reset = useCallback(() => {
    setCurrentStep(0);
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  return {
    // State
    currentStep,
    formData,
    errors,
    isSubmitting,

    // Computed
    isFirstStep,
    isLastStep,
    totalSteps,

    // Methods
    updateFormData,
    updateMultipleFields,
    setValidationErrors,
    clearErrors,
    nextStep,
    previousStep,
    goToStep,
    handleSubmit,
    reset
  };
}
