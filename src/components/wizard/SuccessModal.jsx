import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/**
 * SuccessModal - Success confirmation screen after wizard completion
 * Matches mockup design with icon, message, and action buttons
 */
export default function SuccessModal({
  isOpen,
  onClose,
  title = 'Sucesso!',
  message,
  icon = null,
  iconBg = null,
  variant = 'success',
  primaryAction = null,
  secondaryAction = null,
  autoCloseDelay = null
}) {
  const { t } = useTranslation();

  // Auto-close after delay if specified
  useEffect(() => {
    if (isOpen && autoCloseDelay) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  const isError = variant === 'error';

  // Default icons
  const defaultIcon = isError ? (
    <svg className="w-20 h-20 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div className="bg-[#fffefc] rounded-[20px] shadow-2xl w-full max-w-[440px] mx-4 px-8 py-10">
        {/* Content */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Icon — pass icon={false} to hide the icon circle entirely */}
          {icon !== false && (
            <div
              className={`rounded-full w-[120px] h-[120px] flex items-center justify-center ${iconBg || (isError ? 'bg-red-50' : 'bg-[#fde047]')}`}
            >
              {icon || defaultIcon}
            </div>
          )}

          {/* Title */}
          <h2 className="font-['Onest',sans-serif] font-bold text-[28px] leading-tight text-[#0a0a0a]">
            {title}
          </h2>

          {/* Message */}
          {message && (
            <p className="font-['Onest',sans-serif] font-medium text-[17px] leading-6 text-[#0a0a0a] max-w-[320px]">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col items-center gap-3 w-full mt-2">
            {/* Primary Action */}
            {primaryAction && (
              <button
                type="button"
                onClick={() => {
                  primaryAction.onClick();
                  if (primaryAction.closeAfter !== false) {
                    onClose();
                  }
                }}
                className="font-['Onest',sans-serif] text-[17px] font-medium text-[#fafafa] bg-[#009368] hover:bg-[#007d57] px-8 py-3 rounded-full transition-colors"
              >
                {primaryAction.label}
              </button>
            )}

            {/* Secondary Action */}
            {secondaryAction && (
              <button
                type="button"
                onClick={() => {
                  secondaryAction.onClick();
                  if (secondaryAction.closeAfter !== false) {
                    onClose();
                  }
                }}
                className="font-['Onest',sans-serif] text-[17px] font-medium text-[#404040] hover:text-[#0a0a0a] px-6 py-2 rounded-full transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}

            {/* Default close button if no actions provided */}
            {!primaryAction && !secondaryAction && (
              <button
                type="button"
                onClick={onClose}
                className="font-['Onest',sans-serif] text-[17px] font-medium text-[#fafafa] bg-[#009368] hover:bg-[#007d57] px-8 py-3 rounded-full transition-colors"
              >
                {t('common.close')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

SuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.node,
  iconBg: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'error']),
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    closeAfter: PropTypes.bool
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    closeAfter: PropTypes.bool
  }),
  autoCloseDelay: PropTypes.number
};
