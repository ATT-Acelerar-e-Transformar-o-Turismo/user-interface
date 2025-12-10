import { useEffect } from 'react';
import PropTypes from 'prop-types';
import WizardProgress from './WizardProgress';
import WizardButtons from './WizardButtons';

/**
 * Wizard - Main multi-step wizard container component
 * Provides modal wrapper, progress tracking, and navigation
 */
export default function Wizard({
  isOpen,
  onClose,
  title,
  steps,
  currentStep,
  onStepChange,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  disableNext = false,
  children,
  showProgress = true,
  allowStepClick = false,
  className = ''
}) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleNext = async () => {
    if (isLastStep) {
      try {
        await onSubmit();
      } catch (error) {
        // Error is already logged in useWizard, just prevent propagation
        console.error('Submission failed:', error);
      }
    } else {
      onNext();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Close on backdrop click (not on modal content click)
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div
        className={`
          bg-white rounded-[23px] shadow-2xl
          w-full max-w-2xl max-h-[90vh]
          mx-4 overflow-hidden
          flex flex-col
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          {/* Title */}
          <h1 className="font-['Onest',sans-serif] font-semibold text-3xl text-black">
            {title}
          </h1>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        {showProgress && (
          <div className="px-8 border-b border-gray-200">
            <WizardProgress
              steps={steps}
              currentStep={currentStep}
              onStepClick={allowStepClick ? onStepChange : null}
            />
          </div>
        )}

        {/* Content Area (scrollable) */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>

        {/* Footer with Navigation Buttons */}
        <div className="px-8 py-6 border-t border-gray-200">
          <WizardButtons
            onPrevious={onPrevious}
            onNext={handleNext}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={isSubmitting}
            disableNext={disableNext}
          />
        </div>
      </div>
    </div>
  );
}

Wizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentStep: PropTypes.number.isRequired,
  onStepChange: PropTypes.func,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  disableNext: PropTypes.bool,
  children: PropTypes.node.isRequired,
  showProgress: PropTypes.bool,
  allowStepClick: PropTypes.bool,
  className: PropTypes.string
};
