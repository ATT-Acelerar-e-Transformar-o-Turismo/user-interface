import { useEffect } from 'react';
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
  primaryAction = null,
  secondaryAction = null,
  autoCloseDelay = null
}) {
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

  // Debug logging
  console.log('SuccessModal render:', { isOpen, title, message });

  // Don't render if not open
  if (!isOpen) return null;

  // Default success icon if none provided
  const defaultIcon = (
    <svg className="w-20 h-20 text-[#00855d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-white rounded-[23px] shadow-2xl w-full max-w-md mx-4 p-8">
        {/* Content */}
        <div className="flex flex-col items-center gap-6">
          {/* Icon */}
          <div className="bg-[#f1f0f0] rounded-full p-6">
            {icon || defaultIcon}
          </div>

          {/* Title */}
          <h2 className="font-['Onest',sans-serif] font-bold text-2xl text-black text-center">
            {title}
          </h2>

          {/* Message */}
          {message && (
            <p className="font-['Onest',sans-serif] text-base text-gray-600 text-center">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full mt-4">
            {/* Primary Action */}
            {primaryAction && (
              <button
                type="button"
                onClick={() => {
                  console.log('SuccessModal: Primary button clicked:', primaryAction.label);
                  primaryAction.onClick();
                  if (primaryAction.closeAfter !== false) {
                    console.log('SuccessModal: Auto-closing modal');
                    onClose();
                  } else {
                    console.log('SuccessModal: NOT auto-closing (closeAfter=false)');
                  }
                }}
                className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-6 py-3 rounded-lg transition-colors w-full"
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
                className="font-['Onest',sans-serif] text-sm font-medium text-gray-700 hover:text-black px-6 py-3 rounded-lg transition-colors w-full"
              >
                {secondaryAction.label}
              </button>
            )}

            {/* Default close button if no actions provided */}
            {!primaryAction && !secondaryAction && (
              <button
                type="button"
                onClick={onClose}
                className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-6 py-3 rounded-lg transition-colors w-full"
              >
                Fechar
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
