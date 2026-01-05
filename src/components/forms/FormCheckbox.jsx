import PropTypes from 'prop-types';

/**
 * FormCheckbox - Reusable checkbox component with label and validation
 * Matches mockup design with consistent styling
 */
export default function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  error = null,
  disabled = false,
  description = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Checkbox and Label */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`
            w-5 h-5 mt-0.5
            rounded border-2
            ${error ? 'border-red-500' : 'border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            text-[#00855d] focus:ring-2 focus:ring-[#00855d]/20
            transition-colors
          `}
        />

        {/* Label and Description */}
        <div className="flex flex-col gap-1">
          {label && (
            <label
              htmlFor={name}
              className={`
                font-['Onest',sans-serif] font-medium text-sm text-black
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {label}
            </label>
          )}

          {description && (
            <p className="font-['Onest',sans-serif] text-xs text-gray-600">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${name}-error`}
          className="font-['Onest',sans-serif] text-xs text-red-500 ml-8"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

FormCheckbox.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  description: PropTypes.string,
  className: PropTypes.string
};
