import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

/**
 * FileUpload - Component for uploading files with preview
 * Supports image uploads with preview display
 */
export default function FileUpload({
  label,
  name,
  value,
  onChange,
  onUpload,
  accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
  required = false,
  error = null,
  disabled = false,
  className = '',
  showPreview = true
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const uploadedUrl = await onUpload(file);
      onChange(uploadedUrl);
    } catch (err) {
      const errorMsg = err.userMessage || err.message || t('components.file_upload.error');
      setUploadError(errorMsg);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = error || uploadError;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="font-['Onest',sans-serif] font-medium text-sm text-black"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('components.file_upload.placeholder')}
          disabled={disabled || uploading}
          aria-invalid={displayError ? 'true' : 'false'}
          aria-describedby={displayError ? `${name}-error` : undefined}
          className={`
            font-['Onest',sans-serif] text-sm text-black
            bg-[#f1f0f0] rounded-lg px-4 py-3
            border-2 transition-colors flex-1
            ${displayError
              ? 'border-red-500 focus:border-red-600'
              : 'border-transparent focus:border-primary'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}
            focus:outline-none focus:ring-2 focus:ring-primary/20
          `}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          aria-label={t('components.file_upload.select_file', { label })}
        />

        <button
          type="button"
          onClick={handleBrowseClick}
          disabled={disabled || uploading}
          className={`
            font-['Onest',sans-serif] text-sm font-medium
            px-4 py-3 rounded-lg transition-colors whitespace-nowrap
            ${uploading
              ? 'bg-gray-400 cursor-wait'
              : 'bg-primary hover:bg-[color:var(--color-primary-hover)] text-white'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? t('components.file_upload.uploading') : t('components.file_upload.upload_btn')}
        </button>
      </div>

      {showPreview && value && (
        <div className="mt-2 p-3 bg-[#f1f0f0] rounded-lg">
          <img
            src={value}
            alt="Preview"
            className="max-h-32 rounded object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {displayError && (
        <p
          id={`${name}-error`}
          className="font-['Onest',sans-serif] text-xs text-red-500"
          role="alert"
        >
          {displayError}
        </p>
      )}
    </div>
  );
}

FileUpload.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  accept: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  showPreview: PropTypes.bool
};
