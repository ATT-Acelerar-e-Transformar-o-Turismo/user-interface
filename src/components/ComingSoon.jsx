import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageTemplate from '../pages/PageTemplate';

export default function ComingSoon() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageTemplate>
      <div className="min-h-[calc(100vh-var(--navbar-height))] flex items-center justify-center px-6 py-16 sm:py-24">
        <div className="flex flex-col items-center gap-10 max-w-[1003px] w-full">
          <img
            src="/farol.svg"
            alt=""
            className="w-[220px] sm:w-[300px] h-auto"
          />

          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="font-['Onest'] font-semibold text-[32px] sm:text-[48px] leading-none tracking-tight text-black">
              {t('coming_soon.title')}
            </h1>
            <p className="font-['Onest'] text-base sm:text-2xl leading-snug text-black whitespace-pre-line">
              {t('coming_soon.body')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 border border-[#d4d4d4] rounded-full px-7 py-3 text-base font-['Onest'] font-medium text-[#0a0a0a] hover:bg-white/60 shadow-sm cursor-pointer min-h-[49px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('coming_soon.back')}
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-primary text-primary-content rounded-full px-7 py-3 text-base font-['Onest'] font-medium hover:bg-[color:var(--color-primary-hover)] transition-colors min-h-[49px]"
            >
              {t('coming_soon.home')}
            </Link>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
