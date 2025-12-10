import PropTypes from 'prop-types';

/**
 * WizardStep - Individual step wrapper component
 * Provides consistent layout for step content
 */
export default function WizardStep({ title, description, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Step Header */}
      {(title || description) && (
        <div className="flex flex-col gap-2">
          {title && (
            <h2 className="font-['Onest',sans-serif] font-semibold text-2xl text-black">
              {title}
            </h2>
          )}
          {description && (
            <p className="font-['Onest',sans-serif] text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Step Content */}
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

WizardStep.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
