/**
 * Form Validation Utilities
 * Reusable validation functions for form inputs
 */

/**
 * Validate if a value is not empty
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(value, fieldName = 'Este campo') {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} é obrigatório`;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} é obrigatório`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} é obrigatório`;
  }
  return null;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(email) {
  if (!email) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido';
  }
  return null;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateURL(url) {
  if (!url) return null;

  try {
    new URL(url);
    return null;
  } catch (error) {
    return 'URL inválido';
  }
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in megabytes
 * @returns {string|null} Error message or null if valid
 */
export function validateFileSize(file, maxSizeMB = 50) {
  if (!file) return null;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `O ficheiro não pode exceder ${maxSizeMB}MB`;
  }
  return null;
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types or extensions
 * @returns {string|null} Error message or null if valid
 */
export function validateFileType(file, allowedTypes = []) {
  if (!file || allowedTypes.length === 0) return null;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  const isAllowed = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      // Extension match
      return fileName.endsWith(type.toLowerCase());
    }
    // MIME type match
    return fileType === type.toLowerCase() || fileType.startsWith(type.toLowerCase() + '/');
  });

  if (!isAllowed) {
    const typesList = allowedTypes.join(', ');
    return `Tipo de ficheiro não permitido. Tipos aceites: ${typesList}`;
  }
  return null;
}

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.integer - Whether value must be an integer
 * @returns {string|null} Error message or null if valid
 */
export function validateNumeric(value, options = {}) {
  if (value === null || value === undefined || value === '') return null;

  const num = Number(value);

  if (isNaN(num)) {
    return 'Valor deve ser numérico';
  }

  if (options.integer && !Number.isInteger(num)) {
    return 'Valor deve ser um número inteiro';
  }

  if (options.min !== undefined && num < options.min) {
    return `Valor deve ser maior ou igual a ${options.min}`;
  }

  if (options.max !== undefined && num > options.max) {
    return `Valor deve ser menor ou igual a ${options.max}`;
  }

  return null;
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum length
 * @param {number} options.max - Maximum length
 * @returns {string|null} Error message or null if valid
 */
export function validateLength(value, options = {}) {
  if (!value) return null;

  const length = value.length;

  if (options.min !== undefined && length < options.min) {
    return `Deve ter pelo menos ${options.min} caracteres`;
  }

  if (options.max !== undefined && length > options.max) {
    return `Deve ter no máximo ${options.max} caracteres`;
  }

  return null;
}

/**
 * Validate that value matches another field (for password confirmation, etc.)
 * @param {any} value - Value to validate
 * @param {any} matchValue - Value to match against
 * @param {string} fieldName - Name of the field being matched
 * @returns {string|null} Error message or null if valid
 */
export function validateMatch(value, matchValue, fieldName = 'campo') {
  if (value !== matchValue) {
    return `Deve corresponder ao ${fieldName}`;
  }
  return null;
}

/**
 * Run multiple validation functions on a value
 * @param {any} value - Value to validate
 * @param {Function[]} validators - Array of validation functions
 * @returns {string|null} First error message or null if all valid
 */
export function runValidators(value, validators = []) {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Validate an entire form object
 * @param {Object} formData - Form data to validate
 * @param {Object} validationRules - Object mapping field names to validation functions
 * @returns {Object} Object with field names as keys and error messages as values
 */
export function validateForm(formData, validationRules) {
  const errors = {};

  for (const [field, validators] of Object.entries(validationRules)) {
    const value = formData[field];
    const error = runValidators(value, Array.isArray(validators) ? validators : [validators]);

    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Check if there are any errors in the errors object
 * @param {Object} errors - Errors object
 * @returns {boolean} True if there are errors, false otherwise
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
