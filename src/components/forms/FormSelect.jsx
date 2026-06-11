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
          className="font-['Onest',sans-serif] font-semibold text-[18px] text-[#0a0a0a]"
        >
          {label}
          {required && <span className="text-[#dc2626] ml-1">*</span>}
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
            font-['Onest',sans-serif] text-[16px]
            bg-[#fffefc] rounded-full px-5 py-3.5 pr-12
            border transition-colors
            appearance-none w-full
            ${error
              ? 'border-[#dc2626] focus:border-[#dc2626]'
              : 'border-[#e5e5e5] focus:border-[#009368]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${!value ? 'text-[#737373]' : 'text-[#0a0a0a]'}
            focus:outline-none focus:ring-2 focus:ring-[#009368]/20
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
