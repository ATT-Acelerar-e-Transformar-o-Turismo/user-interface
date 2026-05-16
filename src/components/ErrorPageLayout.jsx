import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';

// Shared frame for the /403, /404 and /500 routes. Mirrors the Figma error
// designs: navbar pinned to the top, hero illustration + title + description
// centered, action buttons below. Footer at the bottom.
export default function ErrorPageLayout({
  illustration,
  illustrationAlt,
  title,
  description,
  primaryLabel,
  primaryTo = '/',
  showBack = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f4f6] font-['Onest']">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-32 lg:py-40">
        <div className="flex flex-col items-center gap-10 max-w-[1124px] w-full">
          <img
            src={illustration}
            alt={illustrationAlt}
            className="h-[220px] lg:h-[270px] w-auto select-none pointer-events-none"
            draggable={false}
          />

          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-[36px] lg:text-[48px] font-semibold tracking-[-0.48px] leading-none text-[#0a0a0a]">
              {title}
            </h1>
            <p className="text-[18px] lg:text-[24px] leading-[1.23] text-[#0a0a0a] max-w-[1124px]">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 mt-2">
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 min-h-[49px] px-7 py-3 rounded-full bg-white border border-[#d4d4d4] text-[17px] font-medium text-[#0a0a0a] shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                {t('errors.back', 'Voltar')}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(primaryTo)}
              className="inline-flex items-center justify-center min-h-[49px] px-7 py-3 rounded-full bg-[#084d92] text-[17px] font-medium text-[#fafafa] hover:bg-[#06407a] transition-colors cursor-pointer"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

ErrorPageLayout.propTypes = {
  illustration: PropTypes.string.isRequired,
  illustrationAlt: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  primaryLabel: PropTypes.string.isRequired,
  primaryTo: PropTypes.string,
  showBack: PropTypes.bool,
};
