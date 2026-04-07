import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-[23px] shadow-2xl w-full max-w-sm mx-4 p-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </div>
          <h3 className="font-['Onest',sans-serif] font-semibold text-xl text-[#0a0a0a]">
            {title || t('common.confirm_title')}
          </h3>
          <p className="font-['Onest',sans-serif] text-sm text-gray-600">
            {message}
          </p>
        </div>
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={onCancel}
            className="font-['Onest',sans-serif] text-sm font-medium text-gray-700 hover:text-black px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="font-['Onest',sans-serif] text-sm font-medium text-white bg-primary hover:bg-[color:var(--color-primary-hover)] px-8 py-3 rounded-lg transition-colors cursor-pointer"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
};
