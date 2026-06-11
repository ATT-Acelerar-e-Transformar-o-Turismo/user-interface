import PropTypes from 'prop-types';

/**
 * FormInput - Reusable text input component with label and validation
 * Matches mockup design with light gray backgrounds and rounded corners
 */
export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
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

      {/* Input */}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`
          font-['Onest',sans-serif] text-[16px] text-[#0a0a0a] placeholder-[#737373]
          bg-[#fffefc] rounded-full px-5 py-3.5
          border transition-colors
          ${error
            ? 'border-[#dc2626] focus:border-[#dc2626]'
            : 'border-[#e5e5e5] focus:border-[#009368]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-[#009368]/20
        `}
      />

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

FormInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url']),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};
