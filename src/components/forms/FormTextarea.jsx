import PropTypes from 'prop-types';

/**
 * FormTextarea - Reusable textarea component with label and validation
 * Matches mockup design with light gray backgrounds and rounded corners
 */
export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = null,
  disabled = false,
  rows = 4,
  maxLength = null,
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

      {/* Textarea */}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`
          font-['Onest',sans-serif] text-[16px] text-[#0a0a0a] placeholder-[#737373]
          bg-[#fffefc] rounded-[20px] px-5 py-3.5
          border transition-colors resize-y
          ${error
            ? 'border-[#dc2626] focus:border-[#dc2626]'
            : 'border-[#e5e5e5] focus:border-[#009368]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-[#009368]/20
        `}
      />

      {/* Character count and error message container */}
      <div className="flex justify-between items-center">
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

        {/* Character count */}
        {maxLength && (
          <p className="font-['Onest',sans-serif] text-xs text-gray-500 ml-auto">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

FormTextarea.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  className: PropTypes.string
};
