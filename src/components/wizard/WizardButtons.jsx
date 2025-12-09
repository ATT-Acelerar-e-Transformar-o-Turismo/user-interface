import PropTypes from 'prop-types';

/**
 * WizardButtons - Navigation buttons for wizard (Voltar, Continuar)
 * Matches mockup design with consistent styling
 */
export default function WizardButtons({
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  nextLabel = 'Continuar',
  previousLabel = 'Voltar',
  submitLabel = 'Concluir',
  disableNext = false,
  className = ''
}) {
  return (
    <div className={`flex justify-between items-center gap-4 ${className}`}>
      {/* Previous Button */}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrevious}
          disabled={isSubmitting}
          className="font-['Onest',sans-serif] text-sm font-medium text-gray-700 hover:text-black px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {previousLabel}
        </button>
      )}

      {/* Spacer if on first step */}
      {isFirstStep && <div />}

      {/* Next/Submit Button */}
      <button
        type="button"
        onClick={onNext}
        disabled={disableNext || isSubmitting}
        className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            A processar...
          </>
        ) : (
          isLastStep ? submitLabel : nextLabel
        )}
      </button>
    </div>
  );
}

WizardButtons.propTypes = {
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  isFirstStep: PropTypes.bool.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool,
  nextLabel: PropTypes.string,
  previousLabel: PropTypes.string,
  submitLabel: PropTypes.string,
  disableNext: PropTypes.bool,
  className: PropTypes.string
};
