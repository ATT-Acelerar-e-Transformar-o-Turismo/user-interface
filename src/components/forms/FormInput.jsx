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
          className="font-['Onest',sans-serif] font-medium text-sm text-black"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
          font-['Onest',sans-serif] text-sm text-black
          bg-[#f1f0f0] rounded-lg px-4 py-3
          border-2 transition-colors
          ${error
            ? 'border-red-500 focus:border-red-600'
            : 'border-transparent focus:border-[#00855d]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}
          focus:outline-none focus:ring-2 focus:ring-[#00855d]/20
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
