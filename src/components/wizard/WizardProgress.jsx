import PropTypes from 'prop-types';

/**
 * WizardProgress - Progress indicator with dots and step labels
 * Matches mockup design with filled/outline dots
 */
export default function WizardProgress({ steps, currentStep, onStepClick = null }) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          {/* Dot Indicator */}
          <button
            type="button"
            onClick={() => onStepClick && onStepClick(index)}
            disabled={!onStepClick}
            className={`
              w-3 h-3 rounded-full transition-all
              ${index === currentStep
                ? 'bg-[#00855d] scale-125'
                : index < currentStep
                ? 'bg-[#00855d]'
                : 'border-2 border-gray-400 bg-transparent'
              }
              ${onStepClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            `}
            aria-label={`${step} - ${index === currentStep ? 'Passo atual' : index < currentStep ? 'Completo' : 'Pendente'}`}
          />

          {/* Step Label */}
          <p
            className={`
              font-['Onest',sans-serif] text-xs text-center whitespace-nowrap
              ${index === currentStep
                ? 'font-semibold text-black'
                : index < currentStep
                ? 'font-medium text-gray-600'
                : 'font-normal text-gray-500'
              }
            `}
          >
            {step}
          </p>

          {/* Connector Line (not shown after last step) */}
          {index < steps.length - 1 && (
            <div
              className={`
                absolute top-[12px] w-4 h-0.5 ml-[28px]
                ${index < currentStep ? 'bg-[#00855d]' : 'bg-gray-300'}
              `}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

WizardProgress.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentStep: PropTypes.number.isRequired,
  onStepClick: PropTypes.func
};
