import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useWrapper } from '../../contexts/WrapperContext';
import { showError } from '../../utils/toast';

/**
 * Button + confirmation dialog that re-queues a wrapper for generation.
 *
 * Self-contained: opens a DaisyUI modal warning the user that regenerating
 * will discard existing data. On confirm, calls the backend and invokes
 * `onRegenerated(updatedWrapper)` so the parent can reset UI state (polling,
 * cached resource data, etc.).
 */
export default function RegenerateWrapperButton({
  wrapperId,
  onRegenerated,
  className = 'btn btn-sm btn-outline',
  label,
  disabled = false,
}) {
  const { t } = useTranslation();
  const { regenerateWrapper } = useWrapper();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const open = () => setConfirmOpen(true);
  const close = () => {
    if (!submitting) setConfirmOpen(false);
  };

  const handleConfirm = async () => {
    if (!wrapperId) return;
    setSubmitting(true);
    try {
      const updated = await regenerateWrapper(wrapperId);
      if (onRegenerated) onRegenerated(updated);
      setConfirmOpen(false);
    } catch (error) {
      const msg = error?.userMessage || error?.message || t('wizard.resource.generation_failed');
      showError(msg, 7000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={open}
        disabled={disabled || !wrapperId}
      >
        {label || t('wizard.resource.regenerate_wrapper')}
      </button>

      {confirmOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('wizard.resource.regenerate_confirm_title')}</h3>
            <p className="py-4">{t('wizard.resource.regenerate_confirm_body')}</p>
            <div className="modal-action">
              <button type="button" className="btn" onClick={close} disabled={submitting}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? t('common.processing') : t('wizard.resource.regenerate_wrapper')}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={close}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}

RegenerateWrapperButton.propTypes = {
  wrapperId: PropTypes.string,
  onRegenerated: PropTypes.func,
  className: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool,
};
