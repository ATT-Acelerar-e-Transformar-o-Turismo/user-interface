import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SESSION_FLAG = 'att.underDevelopmentNotice.shown';

/**
 * One-per-session notice informing visitors the platform is still under
 * active development. Illustration ported from Figma ROOTS "A preparar
 * novidades" design (node 2691:7789), copy overridden to the platform-wide
 * message requested.
 */
export default function UnderDevelopmentModal() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.sessionStorage.getItem(SESSION_FLAG);
      if (!seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const close = () => {
    try {
      window.sessionStorage.setItem(SESSION_FLAG, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="under-dev-title"
    >
      <div className="bg-white rounded-[23px] shadow-2xl w-full max-w-xl mx-4 p-8 md:p-10 max-h-[95vh] overflow-y-auto">
        <div className="flex flex-col items-center gap-8">
          <img
            src="/farol.svg"
            alt=""
            aria-hidden
            className="w-auto h-auto max-w-full max-h-[40vh] object-contain"
          />
          <div className="flex flex-col items-center text-center gap-4">
            <h3
              id="under-dev-title"
              className="font-['Onest',sans-serif] font-semibold text-[32px] md:text-[40px] leading-none tracking-tight text-black"
            >
              {t('under_development.title')}
            </h3>
            <p className="font-['Onest',sans-serif] text-base md:text-lg text-black whitespace-pre-line">
              {t('under_development.body')}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="font-['Onest',sans-serif] font-medium text-[17px] text-white bg-primary hover:bg-[color:var(--color-primary-hover)] px-8 py-3 rounded-full transition-colors cursor-pointer"
          >
            {t('under_development.acknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
}
