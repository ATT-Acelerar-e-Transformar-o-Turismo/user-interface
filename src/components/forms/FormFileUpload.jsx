import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * FormFileUpload - Drag-and-drop file upload component with validation
 * Matches mockup design with dashed border drop zone
 */
export default function FormFileUpload({
  label,
  name,
  file,
  files,
  onChange,
  accept = '*',
  maxSizeMB = 50,
  required = false,
  error = null,
  disabled = false,
  multiple = false,
  className = ''
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Use files array if multiple, otherwise single file
  const fileList = multiple ? (files || []) : (file ? [file] : []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      if (multiple) {
        onChange(Array.from(droppedFiles));
      } else {
        onChange(droppedFiles[0]);
      }
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      if (multiple) {
        onChange(Array.from(selectedFiles));
      } else {
        onChange(selectedFiles[0]);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index = null) => {
    if (multiple && index !== null) {
      // Remove specific file from array
      const newFiles = fileList.filter((_, i) => i !== index);
      onChange(newFiles.length > 0 ? newFiles : []);
    } else {
      // Remove all files
      onChange(multiple ? [] : null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          bg-[#f1f0f0] rounded-lg p-8
          border-2 border-dashed transition-all
          ${isDragging
            ? 'border-[#00855d] bg-[#00855d]/5'
            : error
            ? 'border-red-500'
            : 'border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#00855d] hover:bg-gray-200'}
        `}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id={name}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
        />

        {fileList.length > 0 ? (
          /* File(s) Selected */
          <div className="flex flex-col items-center gap-4 w-full">
            {fileList.map((f, index) => (
              <div key={index} className="flex items-center justify-between w-full bg-white rounded-lg p-3">
                {/* File Icon and Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f1f0f0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#00855d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Onest',sans-serif] font-medium text-sm text-black">
                      {f.name}
                    </p>
                    <p className="font-['Onest',sans-serif] text-xs text-gray-600">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(multiple ? index : null)}
                    className="text-red-600 hover:text-red-700 transition-colors p-2"
                    title="Remover"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* Add More Button for multiple mode */}
            {multiple && !disabled && (
              <button
                type="button"
                onClick={handleButtonClick}
                className="font-['Onest',sans-serif] text-sm font-medium text-[#00855d] hover:text-[#007550] transition-colors"
              >
                + Adicionar mais ficheiros
              </button>
            )}
          </div>
        ) : (
          /* No File Selected */
          <div className="flex flex-col items-center gap-4">
            {/* Upload Icon */}
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="font-['Onest',sans-serif] text-sm text-black">
                {multiple ? 'Arraste e solte os ficheiros aqui' : 'Arraste e solte o ficheiro aqui'}
              </p>
              <p className="font-['Onest',sans-serif] text-xs text-gray-600 mt-1">
                ou clique no botão abaixo
              </p>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={disabled}
              className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {multiple ? 'Carregar Ficheiros' : 'Carregar Ficheiro'}
            </button>

            {/* Size Limit */}
            <p className="font-['Onest',sans-serif] text-xs text-gray-500">
              até {maxSizeMB}MB
            </p>
          </div>
        )}
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

FormFileUpload.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  file: PropTypes.object,
  files: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accept: PropTypes.string,
  maxSizeMB: PropTypes.number,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  className: PropTypes.string
};
