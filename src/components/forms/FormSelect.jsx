import PropTypes from 'prop-types';

/**
 * FormSelect - Reusable select/dropdown component with label and validation
 * Matches mockup design with light gray backgrounds and rounded corners
 */
export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção',
  required = false,
  error = null,
  disabled = false,
  className = ''
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="font-['Onest',sans-serif] font-medium text-sm text-black"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select */}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`
            font-['Onest',sans-serif] text-sm text-black
            bg-[#f1f0f0] rounded-lg px-4 py-3
            border-2 transition-colors
            appearance-none w-full
            ${error
              ? 'border-red-500 focus:border-red-600'
              : 'border-transparent focus:border-[#00855d]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'}
            ${!value ? 'text-gray-500' : 'text-black'}
            focus:outline-none focus:ring-2 focus:ring-[#00855d]/20
          `}
        >
          {/* Placeholder option */}
          <option value="" disabled>
            {placeholder}
          </option>

          {/* Options */}
          {options.map((option) => {
            // Support both string arrays and object arrays
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${name}-error`}
          className="font-['Onest',sans-serif] text-xs text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

FormSelect.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
      })
    ])
  ).isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};
